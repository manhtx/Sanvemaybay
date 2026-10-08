"""Discover current flight candidates with the open-source fast-flights package.

This worker reads enabled routes with the public key, queries Google Flights
through fast-flights, and writes normalized observations directly to Supabase
with a server-only secret key. The secret is supplied by GitHub Actions and is
never shipped to the browser.
The result is an indicative discovery observation. Scraped search results and
route-based URLs are never promoted to live or affiliate inventory.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any

from fast_flights import FlightQuery, Passengers, create_query, get_flights
from fast_flights.fetcher import fetch_flights_html
from fast_flights.parser import _parse_time, Airport, SimpleDatetime, SingleFlight, CarbonEmission, Flights
from selectolax.lexbor import LexborHTMLParser


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
DRY_RUN_FULL_JSON = os.environ.get("FAST_FLIGHTS_DRY_RUN_FULL_JSON", "false").lower() == "true"
SUPABASE_SECRET_KEY = env("SUPABASE_SECRET_KEY", required=not DRY_RUN)
WORKER_RELEASE_SHA = os.environ.get("DEPLOYED_COMMIT", os.environ.get("GITHUB_SHA", "unknown")).strip() or "unknown"
RUN_ID = os.environ.get("FLYCHEAP_RUN_ID", "").strip() or str(uuid.uuid4())


def request_json(url: str, headers: dict[str, str], body: bytes | None = None) -> Any:
    retryable_statuses = {408, 425, 429, 500, 502, 503, 504}
    last_error: Exception | None = None
    for attempt in range(3):
        request = urllib.request.Request(url, headers=headers, data=body, method="POST" if body else "GET")
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")[:500]
            last_error = RuntimeError(f"HTTP {error.code} from {url}: {detail}")
            if error.code not in retryable_statuses or attempt == 2:
                raise last_error from error
        except urllib.error.URLError as error:
            last_error = RuntimeError(f"Network error from {url}: {error.reason}")
            if attempt == 2:
                raise last_error from error
        time.sleep(2 ** attempt)
    raise last_error or RuntimeError(f"Request failed: {url}")


def cleanup_old_observations(headers: dict[str, str]) -> None:
    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    params = urllib.parse.urlencode({"link_kind": "eq.indicative", "timestamp": f"lt.{cutoff}"})
    request = urllib.request.Request(f"{BASE_URL}/rest/v1/flights?{params}", headers=headers, method="DELETE")
    with urllib.request.urlopen(request, timeout=45):
        return


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


def fetch_all_flights(query: Any) -> list[Any]:
    """Fetch flight results across all Google Flights sections (Best flights and Other flights).

    fast_flights.get_flights only iterates payload[3][0] (Best flights), completely missing
    LCC carriers (e.g. AirAsia, Vietjet) placed in payload[2][0] (Other flights).
    This function parses all flight candidate sections so no eligible fares are lost.
    """
    try:
        html = fetch_flights_html(query)
        parser = LexborHTMLParser(html)
        script = parser.css_first(r"script.ds\:1")
        if not script:
            return (list(get_flights(query)), "UPSTREAM_DEGRADED_FALLBACK")
        text = script.text()
        if "data:" not in text:
            return (list(get_flights(query)), "UPSTREAM_DEGRADED_FALLBACK")
        data = text.split("data:", 1)[1].rsplit(",", 1)[0]
        if data.endswith("errorHasStatus: true"):
            return ([], "VALID_EMPTY")
        payload = json.loads(data)

        flights = []
        candidate_sections = []
        # payload[3][0]: "Best flights" section
        if len(payload) > 3 and isinstance(payload[3], list) and len(payload[3]) > 0 and isinstance(payload[3][0], list):
            candidate_sections.append(payload[3][0])
        # payload[2][0]: "Other flights" section (crucial for full market coverage)
        if len(payload) > 2 and isinstance(payload[2], list) and len(payload[2]) > 0 and isinstance(payload[2][0], list):
            candidate_sections.append(payload[2][0])

        for section in candidate_sections:
            for k in section:
                if not isinstance(k, list) or len(k) < 2 or not isinstance(k[0], list):
                    continue
                flight_data = k[0]
                price_data = k[1]
                price = price_data[0][1] if price_data and isinstance(price_data, list) and len(price_data) > 0 and len(price_data[0]) > 1 else None
                if price is None or price <= 0:
                    continue
                typ = flight_data[0] if len(flight_data) > 0 else ""
                airlines = flight_data[1] if len(flight_data) > 1 and isinstance(flight_data[1], list) else []
                segments_raw = flight_data[2] if len(flight_data) > 2 and isinstance(flight_data[2], list) else []
                sg_flights = []
                for sf in segments_raw:
                    if not isinstance(sf, list) or len(sf) < 22:
                        continue
                    from_airport = Airport(code=sf[3], name=sf[4])
                    to_airport = Airport(code=sf[6], name=sf[5])
                    dep_time = _parse_time(sf[8])
                    dep_date = tuple(sf[20])
                    dep = SimpleDatetime(date=dep_date, time=dep_time)
                    arr_time = _parse_time(sf[10])
                    arr_date = tuple(sf[21])
                    arr = SimpleDatetime(date=arr_date, time=arr_time)
                    plane_type = sf[17]
                    duration = sf[11]
                    sg_flights.append(SingleFlight(from_airport=from_airport, to_airport=to_airport, departure=dep, arrival=arr, duration=duration, plane_type=plane_type))
                if sg_flights:
                    flights.append(Flights(type=typ, price=price, airlines=airlines, flights=sg_flights, carbon=CarbonEmission(typical_on_route=0, emission=0)))
        return (flights, "CUSTOM_FULL") if flights else (list(get_flights(query)), "UPSTREAM_DEGRADED_FALLBACK")
    except Exception:
        return (list(get_flights(query)), "UPSTREAM_DEGRADED_FALLBACK")


def normalize(result: Any, route: dict[str, Any], outbound: str, returned: str, observed_at: str) -> dict[str, Any] | None:
    segments = value(result, "flights", []) or []
    if not segments:
        return None
    first = segments[0]
    last = segments[-1]
    airline_code = str(value(result, "type", "")).upper()
    airlines = value(result, "airlines", []) or []
    airline = str(airlines[0] if airlines else airline_code).strip()
    price = float(value(result, "price", 0) or 0)
    if not airline_code or not airline or price <= 0:
        return None
    origin_code = route["origin_code"]
    destination_code = route["destination_code"]
    depart_date, depart_time = date_time(value(first, "departure", {}))
    # F12: Use final segment's arrival for final destination arrival
    arrival_date, arrival_time = date_time(value(last, "arrival", {}))
    if not depart_date or not depart_time or not arrival_date or not arrival_time:
        return None

    # F12: Calculate layover-inclusive elapsed journey duration
    flight_durations = sum(int(value(segment, "duration", 0) or 0) for segment in segments)
    elapsed_duration = flight_durations
    try:
        dep_dt = datetime.fromisoformat(f"{depart_date}T{depart_time}")
        arr_dt = datetime.fromisoformat(f"{arrival_date}T{arrival_time}")
        diff_minutes = int((arr_dt - dep_dt).total_seconds() // 60)
        if diff_minutes > 0:
            elapsed_duration = max(diff_minutes, flight_durations)
    except Exception:
        pass
    duration = elapsed_duration
    if duration <= 0:
        return None

    # Google Flights initial search segments represent outbound itinerary legs:
    # 1 leg = direct flight (0 stops). 2 legs = 1 transit stop.
    stops = max(0, len(segments) - 1)

    ordered_segments = []
    for idx, seg in enumerate(segments):
        from_code = airport_code(value(seg, "from_airport", {})) or (origin_code if idx == 0 else "")
        to_code = airport_code(value(seg, "to_airport", {})) or (destination_code if idx == len(segments) - 1 else "")
        s_dep_date, s_dep_time = date_time(value(seg, "departure", {}))
        s_arr_date, s_arr_time = date_time(value(seg, "arrival", {}))
        s_dur = int(value(seg, "duration", 0) or 0)
        ordered_segments.append({
            "segment_order": idx,
            "origin_airport": from_code,
            "destination_airport": to_code,
            "departure_local": f"{s_dep_date}T{s_dep_time}" if s_dep_date and s_dep_time else None,
            "arrival_local": f"{s_arr_date}T{s_arr_time}" if s_arr_date and s_arr_time else None,
            "marketing_carrier": airline_code,
            "duration_minutes": s_dur,
        })

    # Segment route distinguishes itineraries with different connections (D12, A09)
    segment_route = ">".join(f"{s['origin_airport']}-{s['destination_airport']}" for s in ordered_segments) if ordered_segments else f"{origin_code}-{destination_code}"

    # F13: Physical itinerary key MUST NOT contain price (stable physical identity)
    itinerary_key = ":".join([
        origin_code,
        destination_code,
        outbound,
        returned or "",
        airline_code,
        depart_time,
        segment_route,
        str(stops),
    ])
    source_url = google_source_url(origin_code, destination_code, outbound, returned)
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
        "segments": ordered_segments,
        "duration": f"{duration // 60}h {duration % 60}m",
        "booking_url": source_url,
        "source": "fast_flights_google",
        "link_kind": "indicative",
        "affiliate_network": None,
        "affiliate_url": None,
        "itinerary_key": itinerary_key,
        "timestamp": observed_at,
        "departure_time": depart_time,
        "arrival_time": f"{arrival_date}T{arrival_time}",
    }


def search_route(route: dict[str, Any]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    trip_length = int(route.get("trip_length_days") or TRIP_LENGTH_DEFAULT)
    observations: dict[str, dict[str, Any]] = {}
    metrics: dict[str, Any] = {
        "windows_attempted": 0,
        "windows_succeeded": 0,
        "windows_failed": 0,
        "provider_results": 0,
        "normalized_rows": 0,
        "rejected_rows": 0,
        "window_outcomes": [],
        "failure_reasons": [],
    }
    for index in range(WINDOW_LIMIT):
        metrics["windows_attempted"] += 1
        offset = START_OFFSET + index * 30
        outbound = iso_date(offset)
        returned = iso_date(offset + trip_length)
        window_outcome = "UNKNOWN_ERROR"
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
            results, parser_mode = fetch_all_flights(query)
            if parser_mode == "UPSTREAM_DEGRADED_FALLBACK":
                metrics["has_degraded_parser"] = True
                window_outcome = "DEGRADED_FALLBACK"
            elif len(results) == 0:
                window_outcome = "VERIFIED_EMPTY"
            else:
                window_outcome = "COMPLETE"
            metrics.setdefault("parser_modes", []).append(parser_mode)
        except Exception as error:
            metrics["windows_failed"] += 1
            err_str = str(error)
            if isinstance(error, (IndexError, KeyError, TypeError, ValueError)):
                window_outcome = "PARSER_SCHEMA_DRIFT"
            elif "429" in err_str or "rate limit" in err_str.lower():
                window_outcome = "RATE_LIMITED"
            elif any(s in err_str.lower() for s in ["timeout", "connection", "network", "urlerror"]):
                window_outcome = "NETWORK_ERROR"
            elif any(code in err_str for code in ["500", "502", "503", "504"]):
                window_outcome = "PROVIDER_ERROR"
            elif "unsupported" in err_str.lower():
                window_outcome = "UNSUPPORTED"
            else:
                window_outcome = "UNKNOWN_ERROR"
            metrics["window_outcomes"].append(window_outcome)
            metrics["failure_reasons"].append({"type": type(error).__name__, "message": err_str[:160], "outcome": window_outcome})
            print(json.dumps({
                "run_id": RUN_ID,
                "window_failure": {
                    "route": f"{route['origin_code']}-{route['destination_code']}",
                    "outbound": outbound,
                    "returned": returned,
                    "outcome": window_outcome,
                    "reason": err_str,
                }
            }), file=sys.stderr)
            continue
        metrics["window_outcomes"].append(window_outcome)
        metrics["windows_succeeded"] += 1
        metrics["provider_results"] += len(results)
        observed_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()
        for result in results:
            try:
                row = normalize(result, route, outbound, returned, observed_at)
            except (TypeError, ValueError, KeyError, IndexError):
                row = None
            if row:
                observations[row["itinerary_key"]] = row
                metrics["normalized_rows"] += 1
            else:
                metrics["rejected_rows"] += 1
    metrics["deduped_rows"] = len(observations)
    return list(observations.values()), metrics


def classify_failure(error_msg: str) -> str:
    msg = error_msg.lower()
    if "429" in msg or "rate limit" in msg:
        return "RATE_LIMIT"
    if "timeout" in msg or "connection" in msg or "network" in msg or "urlerror" in msg:
        return "NETWORK_ERROR"
    if "json" in msg or "parse" in msg or "syntax" in msg:
        return "PARSER_ERROR"
    if "500" in msg or "502" in msg or "503" in msg or "504" in msg or "provider" in msg:
        return "PROVIDER_ERROR"
    if "unsupported" in msg:
        return "UNSUPPORTED"
    if "no flights" in msg or "zero" in msg or "empty" in msg:
        return "VALID_ZERO"
    return "UNKNOWN"


def direct_ingest(
    routes: list[dict[str, Any]],
    observations: list[dict[str, Any]],
    route_metrics: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    service_headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SECRET_KEY,
        "Authorization": f"Bearer {SUPABASE_SECRET_KEY}",
        "Prefer": "return=representation",
    }
    grouped: dict[str, list[dict[str, Any]]] = {}
    for observation in observations:
        grouped.setdefault(f"{observation['origin_code']}:{observation['destination_code']}", []).append(observation)
    saved = 0
    failures: list[dict[str, str]] = []
    now_iso = datetime.now(timezone.utc).isoformat()
    for route in routes:
        key = f"{route['origin_code']}:{route['destination_code']}"
        rows = grouped.get(key, [])
        metrics = route_metrics.get(key, {})
        observed_at = max((row["timestamp"] for row in rows), default=now_iso)
        attempted = int(metrics.get("windows_attempted", 0))
        succeeded = int(metrics.get("windows_succeeded", 0))
        has_degraded = bool(metrics.get("has_degraded_parser", False))
        window_outcomes = metrics.get("window_outcomes", [])

        # NODE PIPE-01 & PIPE-02: scan_runs.status represents execution lifecycle ('completed', 'failed')
        # health_status represents result quality ('healthy', 'partial', 'degraded', 'failed')
        if succeeded == attempted and attempted > 0 and not has_degraded:
            scan_status = "completed"
            health_status = "healthy"
            failure_class = None
        elif succeeded > 0:
            scan_status = "completed"
            health_status = "degraded" if has_degraded else "partial"
            non_complete = [o for o in window_outcomes if o not in ("COMPLETE", "VERIFIED_EMPTY")]
            failure_class = non_complete[0] if non_complete else ("DEGRADED_COVERAGE" if has_degraded else "PARTIAL_WINDOWS")
        else:
            scan_status = "failed"
            health_status = "failed"
            non_complete = [o for o in window_outcomes if o not in ("COMPLETE", "VERIFIED_EMPTY")]
            failure_class = non_complete[0] if non_complete else classify_failure(str(metrics.get("last_error", "All route windows failed")))

        # Update route operational scheduling state
        route_update = {
            "last_attempt_at": now_iso,
            "updated_at": now_iso,
        }
        if health_status == "healthy":
            route_update["last_success_at"] = now_iso
            route_update["consecutive_failures"] = 0
            route_update["failure_class"] = None
        elif health_status in ("partial", "degraded"):
            route_update["last_success_at"] = now_iso
            route_update["failure_class"] = failure_class
        else:
            route_update["last_failure_at"] = now_iso
            route_update["consecutive_failures"] = int(route.get("consecutive_failures") or 0) + 1
            route_update["failure_class"] = failure_class

        try:
            update_req = urllib.request.Request(
                f"{BASE_URL}/rest/v1/tracked_routes?id=eq.{route['id']}",
                headers=service_headers,
                data=json.dumps(route_update).encode("utf-8"),
                method="PATCH",
            )
            with urllib.request.urlopen(update_req, timeout=15):
                pass
        except Exception:
            pass  # Do not block scan if status tracking patch fails

        scan_body = json.dumps({
            "route_id": route["id"],
            "provider": "fast_flights_google",
            "status": scan_status,
            "health_status": health_status,
            "observations_saved": len(rows),
            "started_at": observed_at,
            "completed_at": observed_at,
            "error_message": "All route windows failed" if scan_status == "failed" else None,
            "response_payload": {
                "worker": "fast-flights",
                "source": "github-actions",
                "run_id": RUN_ID,
                "release_sha": WORKER_RELEASE_SHA,
                "failure_class": failure_class,
                "health_status": health_status,
                **metrics,
            },
        }).encode("utf-8")
        try:
            scan_response = request_json(f"{BASE_URL}/rest/v1/scan_runs", service_headers, scan_body)
            scan_id = scan_response[0]["id"]
            if not rows:
                continue
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
                "link_kind": row["link_kind"], "affiliate_network": row["affiliate_network"],
                "affiliate_url": row["affiliate_url"],
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
    cleanup_old_observations(service_headers)
    return {
        "run_id": RUN_ID,
        "release_sha": WORKER_RELEASE_SHA,
        "observations_received": len(observations),
        "observations_saved": saved,
        "retention_days": 7,
        "failures": failures,
    }


def main() -> int:
    started = time.monotonic()
    public_headers = {"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"}
    routes_url = f"{BASE_URL}/rest/v1/tracked_routes?select=*&enabled=eq.true&order=last_attempt_at.asc.nullsfirst,id.asc&limit={ROUTE_LIMIT}"
    routes = request_json(routes_url, public_headers)
    if not isinstance(routes, list) or not routes:
        raise RuntimeError("No enabled tracked routes were returned")
    observations: list[dict[str, Any]] = []
    failures: list[dict[str, str]] = []
    route_metrics: dict[str, dict[str, Any]] = {}
    for route in routes:
        try:
            found, metrics = search_route(route)
            observations.extend(found)
            route_metrics[f"{route['origin_code']}:{route['destination_code']}"] = metrics
        except Exception as error:  # keep other routes alive when one query fails
            failures.append({"route": f"{route.get('origin_code')}-{route.get('destination_code')}", "reason": str(error)})
    if not observations:
        raise RuntimeError(json.dumps({"message": "fast-flights returned no observations", "failures": failures}))
    if DRY_RUN:
        payload = {"run_id": RUN_ID, "release_sha": WORKER_RELEASE_SHA, "duration_ms": round((time.monotonic() - started) * 1000), "routes": len(routes), "observations": len(observations), "route_metrics": route_metrics, "sample": observations[:3], "failures": failures}
        if DRY_RUN_FULL_JSON:
            payload["observations_data"] = observations
        print(json.dumps(payload))
        return 0
    result = direct_ingest(routes, observations, route_metrics)
    print(json.dumps({"event": "fast_flights_run_completed", "run_id": RUN_ID, "release_sha": WORKER_RELEASE_SHA, "duration_ms": round((time.monotonic() - started) * 1000), "routes": len(routes), "observations": len(observations), "route_metrics": route_metrics, "ingest": result, "failures": failures}))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"fast-flights worker failed: {error}", file=sys.stderr)
        raise SystemExit(1)
