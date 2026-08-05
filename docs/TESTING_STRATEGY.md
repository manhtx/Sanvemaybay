# FlyCheap AI — Testing Strategy

**Version:** 1.0  
**Status:** Active

## Layers

- **Unit/domain:** pure ranking, cost, risk, forecast, alert, promotion and normalization rules.
- **Client integration:** API mapping, persistence fallback, event contracts and malformed payload handling.
- **Edge Function:** Deno typecheck and shared contract tests, including authentication, validation, retry and dedup behavior.
- **Browser UI/E2E:** desktop and Pixel 5 responsive scenarios for success, failure, empty, persisted filters, alerts, comparison, history and detail flows.
- **Runtime integration:** read-only Supabase shape smoke plus deployed provider/function/notification checks when credentials exist.

## Required assertions

Each workflow must cover happy path, invalid input, unavailable/empty data, boundary values, retry/failure behavior and responsive layout where applicable. Tests must use fixtures only for deterministic UI behavior and must label fixtures as fixtures; they cannot prove live provider correctness.

## Release gates

`npm run check`, `npm run check:functions`, `npm run test:functions`, `npm run test:e2e`, `npm run test:integration` and `git diff --check` must pass for workspace verification. CI chạy `check`, function typecheck/tests và E2E; integration smoke chạy riêng với credentials của môi trường kiểm thử. A DoD row additionally requires runtime evidence when the behavior depends on external deployment or credentials.
