"""Refresh the public feed snapshot from current service-owned deals.

This is used by the scheduled worker while the equivalent Edge Function is
being deployed. It never exposes the service key to the browser.
"""

from __future__ import annotations

import json
import os
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
}


def request_json(url: str, method: str = "GET", body: bytes | None = None) -> object:
    request = urllib.request.Request(url, headers=headers, data=body, method=method)
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"HTTP {error.code} from {url}: {detail}") from error


today = datetime.now(timezone.utc).date().isoformat()
now = datetime.now(timezone.utc).isoformat()
deals = request_json(
    f"{base_url}/rest/v1/deals?select=*&depart_date=gte.{today}"
    f"&valid_until=gt.{urllib.parse.quote(now, safe='')}"
    "&order=deal_score.desc"
)
if not isinstance(deals, list):
    raise RuntimeError("Supabase deals response was not a list")

payload = json.dumps({"snapshot_key": "homepage", "payload": deals, "generated_at": now}).encode("utf-8")
request_json(
    f"{base_url}/rest/v1/feed_snapshots?on_conflict=snapshot_key",
    method="POST",
    body=payload,
)
print(json.dumps({"snapshot": "homepage", "deals": len(deals), "generated_at": now}))
