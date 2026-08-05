"""Discover current flight candidates with the open-source fast-flights package.

This worker reads enabled routes with the public key, queries Google Flights
through fast-flights, and writes normalized observations directly to Supabase
with a server-only secret key. The secret is supplied by GitHub Actions and is
never shipped to the browser.
The result is a source observation; affiliate attribution is added only when a
real partner-issued marker/configuration exists.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, timedelta
from typing import Any

from fast_flights import FlightQuery, Passengers, create_query, get_flights


def env(name: str, required: bool = True) -> str:
    value = os.environ.get(name, "").strip()
    if required and not value:
        raise RuntimeError(f"{name} is required")
    return value


BASE_URL = env("VITE_SUPABASE_URL").rstrip("/")
ANON_KEY = env("VITE_SUPABASE_ANON_KEY")
ROUTE_LIMIT = int(os.environ.get("FAST_FLIGHTS_ROUTE_LIMIT", "40"))
WINDOW_LIMIT = int(os.environ.get("FAST_FLIGHTS_WINDOW_LIMIT", "4"))
START_OFFSET = int(os.environ.get("FAST_FLIGHTS_START_OFFSET", "14"))
TRIP_LENGTH_DEFAULT = int(os.environ.get("FAST_FLIGHTS_TRIP_LENGTH_DAYS", "4"))
DRY_RUN = os.environ.get("FAST_FLIGHTS_DRY_RUN", "false").lower() == "true"
SUPABASE_SECRET_KEY = env("SUPABASE_SECRET_KEY", required=not DRY_RUN)


def request_json(url: str, headers: dict[str, str], body: bytes | None = None) -> Any:
    request = urllib.request.Request(url, headers=headers, data=body, method="POST" if body else "GET")
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"HTTP {error.code} from {url}: {detail}") from error


def iso_date(days: int) -> str:
    return (date.today() + timedelta(days=days)).isoformat()


def value(obj: Any, key: str, default: Any = None) -> Any:
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def airport_code(obj: Any) -> str:
    airport = value(obj, "airport", obj)
    return str(value(airport, "code", "")).upper()


def date_time(obj: Any) -> tuple[str, str]:
    raw_date = value(obj, "date", []) or []
    raw_time = value(obj, "time", []) or []
    if not raw_date or not raw_time:
        return "", ""
    return (
        "-".join(f"{int(part):02d}" for part in raw_date),
        ":".join(f"{int(part):02d}" for part in raw_time),
    )


def google_source_url(origin: str, destination: str, outbound: str, returned: str) -> str:
    query = f"Flights to {destination} from {origin} on {outbound} through {returned}"
    params = urllib.parse.urlencode({"q": query, "hl": "vi", "curr": "VND"})
    return f"https://www.google.com/travel/flights?{params}"


def normalize(result: Any, route: dict[str, Any], outbound: str, returned: str, observed_at: str) -> dict[str, Any] | None:
    segments = value(result, "flights", []) or []
    if not segments:
        return None
    first = segments[0]
    airline_code = str(value(result, "type", "")).upper()
    airlines = value(result, "airlines", []) or []
    airline = str(airlines[0] if airlines else airline_code).strip()
    price = float(value(result, "price", 0) or 0)
    if not airline_code or not airline or price <= 0:
        return None
    duration = sum(int(value(segment, "duration", 0) or 0) for segment in segments)
    if duration <= 0:
        return None
    origin_code = route["origin_code"]
    destination_code = route["destination_code"]
    depart_date, depart_time = date_time(value(first, "departure", {}))
    arrival_date, arrival_time = date_time(value(first, "arrival", {}))
    if not depart_date or not depart_time or not arrival_date or not arrival_time:
        return None
    # Round-trip results normally contain outbound and inbound legs. Unknown
    # segment structure is preserved as a conservative stop count, never guessed.
    stops = max(0, len(segments) - 2)
    itinerary_key = ":".join([
        origin_code,
        destination_code,
        outbound,
        returned,
        airline_code,
        depart_time,
        str(price),
    ])
    return {
        "origin": route["origin_name"],
        "origin_code": origin_code,
        "destination": route["destination_name"],
        "destination_code": destination_code,
        "country": route["country"],
        "region": route["region"],
        "price": round(price),
        "currency": "VND",
        "date": outbound,
        "return_date": returned,
        "airline": airline,
        "airline_code": airline_code,
        "flight_number": None,
        "stops": stops,
        "duration": f"{duration // 60}h {duration % 60}m",
        "booking_url": google_source_url(origin_code, destination_code, outbound, returned),
        "source": "fast_flights_google",
        "link_kind": "live_source",
        "itinerary_key": itinerary_key,
        "timestamp": observed_at,
        "departure_time": depart_time,
        "arrival_time": f"{arrival_date}T{arrival_time}",
    }


def search_route(route: dict[str, Any]) -> list[dict[str, Any]]:
    trip_length = int(route.get("trip_length_days") or TRIP_LENGTH_DEFAULT)
    observations: dict[str, dict[str, Any]] = {}
    for index in range(WINDOW_LIMIT):
        offset = START_OFFSET + index * 30
        outbound = iso_date(offset)
        returned = iso_date(offset + trip_length)
        try:
            query = create_query(
                flights=[
                    FlightQuery(date=outbound, from_airport=route["origin_code"], to_airport=route["destination_code"]),
                    FlightQuery(date=returned, from_airport=route["destination_code"], to_airport=route["origin_code"]),
                ],
                seat="economy",
                trip="round-trip",
                passengers=Passengers(adults=1),
                currency="VND",
                language="vi",
            )
            results = get_flights(query)
        except (IndexError, KeyError, TypeError, ValueError) as error:
            # Google occasionally returns an incomplete result page for one
            # date window. Keep the route alive and let later windows run.
            print(json.dumps({
                "window_failure": {
                    "route": f"{route['origin_code']}-{route['destination_code']}",
                    "outbound": outbound,
                    "returned": returned,
                    "reason": str(error),
                }
            }), file=sys.stderr)
            continue
        observed_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()
        for result in results:
            try:
                row = normalize(result, route, outbound, returned, observed_at)
            except (TypeError, ValueError, KeyError):
                row = None
            if row:
                observations[row["itinerary_key"]] = row
    return list(observations.values())


def direct_ingest(routes: list[dict[str, Any]], observations: list[dict[str, Any]]) -> dict[str, Any]:
    service_headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SECRET_KEY,
        "Authorization": f"Bearer {SUPABASE_SECRET_KEY}",
        "Prefer": "return=representation",
    }
    route_map = {f"{route['origin_code']}:{route['destination_code']}": route for route in routes}
    grouped: dict[str, list[dict[str, Any]]] = {}
    for observation in observations:
        grouped.setdefault(f"{observation['origin_code']}:{observation['destination_code']}", []).append(observation)
    saved = 0
    failures: list[dict[str, str]] = []
    for key, rows in grouped.items():
        route = route_map.get(key)
        if not route:
            failures.append({"route": key, "reason": "Route is not enabled"})
            continue
        observed_at = max(row["timestamp"] for row in rows)
        scan_body = json.dumps({
            "route_id": route["id"],
            "provider": "fast_flights_google",
            "status": "completed",
            "observations_saved": len(rows),
            "started_at": observed_at,
            "completed_at": observed_at,
            "response_payload": {"worker": "fast-flights", "source": "github-actions"},
        }).encode("utf-8")
        try:
            scan_response = request_json(f"{BASE_URL}/rest/v1/scan_runs", service_headers, scan_body)
            scan_id = scan_response[0]["id"]
            flight_rows = [{
                "origin": row["origin"], "origin_code": row["origin_code"],
                "destination": row["destination"], "destination_code": row["destination_code"],
                "country": row["country"], "region": row["region"], "price": row["price"],
                "currency": row["currency"], "date": row["date"], "return_date": row["return_date"],
                "airline": row["airline"], "airline_code": row["airline_code"],
                "flight_number": row["flight_number"], "stops": row["stops"],
                "duration": row["duration"], "source": row["source"],
                "booking_url": row["booking_url"], "itinerary_key": row["itinerary_key"],
                "timestamp": row["timestamp"], "route_id": route["id"], "scan_run_id": scan_id,
            } for row in rows]
            flight_headers = {**service_headers, "Prefer": "resolution=merge-duplicates,return=representation"}
            request_json(
                f"{BASE_URL}/rest/v1/flights?on_conflict=itinerary_key,timestamp",
                flight_headers,
                json.dumps(flight_rows).encode("utf-8"),
            )
            saved += len(flight_rows)
        except Exception as error:
            failures.append({"route": key, "reason": str(error)})
    return {"observations_received": len(observations), "observations_saved": saved, "failures": failures}


def main() -> int:
    public_headers = {"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"}
    routes_url = f"{BASE_URL}/rest/v1/tracked_routes?select=*&enabled=eq.true&limit={ROUTE_LIMIT}"
    routes = request_json(routes_url, public_headers)
    if not isinstance(routes, list) or not routes:
        raise RuntimeError("No enabled tracked routes were returned")
    observations: list[dict[str, Any]] = []
    failures: list[dict[str, str]] = []
    for route in routes:
        try:
            observations.extend(search_route(route))
        except Exception as error:  # keep other routes alive when one query fails
            failures.append({"route": f"{route.get('origin_code')}-{route.get('destination_code')}", "reason": str(error)})
    if not observations:
        raise RuntimeError(json.dumps({"message": "fast-flights returned no observations", "failures": failures}))
    if DRY_RUN:
        print(json.dumps({"routes": len(routes), "observations": len(observations), "sample": observations[:3], "failures": failures}))
        return 0
    result = direct_ingest(routes, observations)
    print(json.dumps({"routes": len(routes), "observations": len(observations), "ingest": result, "failures": failures}))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"fast-flights worker failed: {error}", file=sys.stderr)
        raise SystemExit(1)
