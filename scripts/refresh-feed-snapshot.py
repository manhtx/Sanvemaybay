"""Refresh the public feed snapshot from current service-owned deals.

This is used by the scheduled worker while the equivalent Edge Function is
being deployed. It never exposes the service key to the browser.
"""

from __future__ import annotations

import json
import os
import time
import urllib.parse
import urllib.error
import urllib.request
from datetime import datetime, timezone


def env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is required")
    return value


base_url = env("VITE_SUPABASE_URL").rstrip("/")
secret = env("SUPABASE_SECRET_KEY")
headers = {
    "apikey": secret,
    "Authorization": f"Bearer {secret}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=minimal",
}


def request_json(url: str, method: str = "GET", body: bytes | None = None) -> object:
    retryable_statuses = {408, 425, 429, 500, 502, 503, 504}
    last_error: Exception | None = None
    for attempt in range(3):
        request = urllib.request.Request(url, headers=headers, data=body, method=method)
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                raw = response.read().decode("utf-8")
                return json.loads(raw) if raw else None
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


today = datetime.now(timezone.utc).date().isoformat()
now = datetime.now(timezone.utc).isoformat()
deals = request_json(
    f"{base_url}/rest/v1/deals?select=*&depart_date=gte.{today}"
    f"&valid_until=gt.{urllib.parse.quote(now, safe='')}"
    "&order=deal_score.desc"
)
if not isinstance(deals, list):
    raise RuntimeError("Supabase deals response was not a list")

minimum_deals = max(1, int(os.environ.get("MIN_FEED_DEALS", "10")))
minimum_routes = max(1, int(os.environ.get("MIN_FEED_ROUTES", "3")))
future_deals = []
for deal in deals:
    if not isinstance(deal, dict):
        continue
    valid_until = deal.get("valid_until")
    booking_url = deal.get("booking_url")
    if not isinstance(valid_until, str) or not isinstance(booking_url, str):
        continue
    if datetime.fromisoformat(valid_until.replace("Z", "+00:00")) <= datetime.now(timezone.utc):
        continue
    if not booking_url.startswith("https://"):
        continue
    future_deals.append(deal)

route_count = len({(deal.get("from_code"), deal.get("to_code")) for deal in future_deals})
if len(future_deals) < minimum_deals or route_count < minimum_routes:
    raise RuntimeError(
        f"Feed quality gate failed: {len(future_deals)} valid deals across {route_count} routes; "
        f"required at least {minimum_deals} deals and {minimum_routes} routes"
    )

payload = json.dumps({"snapshot_key": "active-deals", "payload": future_deals, "generated_at": now}).encode("utf-8")
request_json(
    f"{base_url}/rest/v1/feed_snapshots?on_conflict=snapshot_key",
    method="POST",
    body=payload,
)
print(json.dumps({"snapshot": "active-deals", "deals": len(future_deals), "routes": route_count, "generated_at": now}))
