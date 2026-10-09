# FARELY OWASP ASVS SECURITY AUDIT & THREAT MODEL REPORT
**Document Reference**: `docs/convergence/SECURITY_REPORT.md`  
**Governing Requirements**: `REQ-SEC-001` through `REQ-SEC-013`  
**Benchmark Standard**: OWASP Application Security Verification Standard (ASVS) v4.0.3  
**Audit Date**: 2026-10-09  
**System Evaluated**: Farely Flight Deal Intelligence Platform (`https://farely.manhtx.com`)  

---

## 1. Security Architecture & Threat Model (STRIDE)

| Threat Category | Potential Attack Vector | Farely Defense in Depth Mitigation | ASVS Ref |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Forged user authentication / session hijacking | Supabase Auth with JWT signatures, TLS 1.3 encryption, client session refresh tokens. | V2, V3 |
| **Tampering** | Modifying private user alerts or saved deals | PostgreSQL Row Level Security (RLS) on all tables; queries scoped to `auth.uid() = user_id`. | V4 |
| **Repudiation** | Denying watch alert dispatch or deletion | Transactional audit records in `notification_outbox` and `account_deletion_requests`. | V7, V8 |
| **Information Disclosure** | Database exfiltration or leaking user emails | Zero PII in public tables; `REVOKE ALL ON FUNCTION ... FROM PUBLIC, anon`; safe error codes in API responses. | V4, V7, V8 |
| **Denial of Service** | Bot flooding alert creation / outbox exhaustion | Cloudflare Turnstile token validation; HMAC-salted rate limiting buckets on IP and email. | V11, V13 |
| **Elevation of Privilege** | Unauthenticated callers executing worker RPCs | All worker RPCs explicitly revoke execution from `PUBLIC`, `anon`, and `authenticated`; execute granted exclusively to `service_role`. | V4, V14 |

---

## 2. OWASP ASVS v4.0.3 Category Verification (`REQ-SEC-013`)

### V1: Architecture, Design and Threat Modeling
- **V1.1 Secure Software Development**: Fully automated continuous integration verifying RLS isolation, migration history integrity, and reproducible release manifests on every commit.
- **V1.4 Access Control Architecture**: Strict zero-trust database boundary separating unprivileged browser requests (`anon`, `authenticated`) from privileged pipeline worker processes (`service_role`).

### V2: Authentication
- **V2.1 Password Security**: Minimum length enforced (`SIGN_UP_PASSWORD_MIN_LENGTH = 8`), safe generic error messages preventing user enumeration (`safeAuthError` never leaks whether an email exists).
- **V2.8 Account Recovery**: Secure password reset flow utilizing signed one-time recovery hashes via Supabase Auth (`/auth#type=recovery`).

### V3: Session Management
- **V3.2 Session Token Binding**: JWT bearer tokens signed with cryptographic keys, short-lived 1-hour expiration with rotating refresh tokens stored in secure local storage.

### V4: Access Control & Row Level Security
- **V4.1 General Access Control**: Row Level Security enabled on all private tables (`user_alerts`, `saved_deals`, `account_deletion_requests`, `notification_outbox`, `flight_watches`).
- **V4.2 Tenant Isolation**: RLS policies strictly enforce `auth.uid() = user_id` for SELECT, INSERT, UPDATE, DELETE. Verified by `scripts/rls-tenant-isolation.node-test.mjs`.
- **V4.3 RPC Privilege Quarantine**: All operational worker procedures revoked from anon/authenticated:
  - `claim_notification_outbox(INT, UUID, INT)` -> `service_role` only
  - `resolve_notification_outbox(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ)` -> `service_role` only
  - `apply_watch_evaluation(...)` -> `service_role` only
  - `publish_observed_generation(UUID, TIMESTAMPTZ, INT)` -> `service_role` only
  - `rollback_observed_generation(UUID, TEXT)` -> `service_role` only
  - `prepare_account_deletion(UUID)` -> `service_role` only
  - Verified by `scripts/rpc-security-role.node-test.mjs`.

### V5: Malicious Input Handling & Validation
- **V5.1 Input Validation**: Canonical schemas validate all flight parameters (`IATA` 3-letter uppercase, ISO-8601 dates, positive finite VND prices).
- **V5.2 Sanitization**: HTML escaping utility (`escapeHtml`) sanitizes all email template interpolations preventing cross-site scripting (XSS).

### V6: Cryptography
- **V6.2 Secrets Management**: Zero credentials committed to git; local `.env` files quarantined by `.gitignore` and enforced by `scripts/release-manifest.node-test.mjs`.
- **V6.3 Signature Integrity**: Email unsubscribe and alert confirmation links signed using HMAC-SHA256 with cryptographically generated 32-byte salts (`UNSUBSCRIBE_SECRET`, `RATE_LIMIT_SALT`).

### V7: Error Handling and Logging
- **V7.1 Error Handling**: Edge Functions and API handlers wrap exceptions with `safeOperationalErrorCode`, returning neutral machine codes (e.g., `invalid_credentials`, `alert_persist_failed`) without backend stack traces.
- **V7.2 Log Sanitization**: Application and Edge Function logs audited to ensure zero `user_id`, `email`, or auth tokens appear in log lines. Verified by `scripts/account-deletion-contract.node-test.mjs`.

### V8: Data Protection
- **V8.1 Personal Data Protection**: Compliant with Vietnamese Law 91/2025/QH15 and Decree 356/2025/ND-CP (detailed in `docs/convergence/PRIVACY_REPORT.md`).
- **V8.3 Data Rights**: Automated export and transactional self-service account deletion via `DataRightsPanel.tsx`.

### V9: Communications
- **V9.1 TLS Protection**: Strict TLS 1.3 enforced across all web routes and API endpoints via Vercel and Cloudflare CDN edges.

### V10: Malicious Code & Supply Chain
- **V10.1 Dependency Audit (`REQ-SEC-012`)**: NPM vulnerability audit threshold maintained at 0 high or critical vulnerabilities (`npm audit`).

### V11: Business Logic
- **V11.1 Anti-Abuse Budget**: Bounded token bucket rate limiting per IP and email prevents abuse of anonymous alerts.
- **V11.2 Watch De-duplication**: Strict single open episode constraint and idempotency keys prevent duplicate alert spam.

### V12: File and Resource Handling
- **V12.1 Static Asset Integrity**: All frontend builds emit deterministic chunk hashes with SRI and immutable caching headers (`Cache-Control: max-age=31536000, immutable`).

### V13: API and Web Services
- **V13.1 Preflight & CORS Contract**: All Edge Functions strictly enforce `OPTIONS` CORS preflight and JSON POST headers. Verified by `scripts/acceptance-matrix-a01-a34.node-test.mjs`.

### V14: Configuration
- **V14.1 Security Headers**: Content Security Policy (CSP), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`. Verified by `scripts/hosting-security.node-test.mjs`.

---

## 3. Conclusion

The Farely application satisfies all applicable Level 1 and Level 2 criteria under OWASP ASVS v4.0.3. All private database surfaces are isolated behind Row Level Security and privilege-gated RPC procedures.
