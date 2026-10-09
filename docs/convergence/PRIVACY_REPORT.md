# FARELY PRIVACY & PERSONAL DATA PROTECTION COMPLIANCE REPORT
**Document Reference**: `docs/convergence/PRIVACY_REPORT.md`  
**Governing Requirements**: `REQ-PRIV-001`, `REQ-PRIV-007`  
**Jurisdiction Standards**: Vietnamese Law on Personal Data Protection (Law 91/2025/QH15), Decree 356/2025/ND-CP, GDPR principles  
**Audit Date**: 2026-10-09  
**System Evaluated**: Farely Flight Deal Intelligence Platform (`https://farely.manhtx.com`)  

---

## 1. Executive Summary

Farely is an independent airfare observation and verification platform. The product operates on a data minimization paradigm:
- **No Identity Documents**: Never collects national identity cards (CCCD), passports, dates of birth, or citizenship details.
- **No Financial Data**: Never stores bank accounts, credit/debit card numbers, CVVs, or billing addresses (Farely is not an OTA and does not take payments or issue tickets).
- **No Telemetry PII**: Application logs strictly prohibit storing user emails or raw IP addresses.

This report documents the canonical Personal Data Inventory (`REQ-PRIV-001`) and the legal gap review under Vietnamese Law 91/2025/QH15 and Decree 356/2025/ND-CP (`REQ-PRIV-007`).

---

## 2. Personal Data Inventory (`REQ-PRIV-001`)

| Category | Data Element | Storage Location | Processing Purpose | Legal Basis (Law 91/2025/QH15) | Retention Period |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Account Identity** | `user_id` (UUID v4) | `auth.users`, `public.user_alerts`, `public.saved_deals` | Tenant isolation, RLS authorization | Contract fulfillment | Active account lifespan |
| **Contact Identity** | `email` (RFC 5322 string) | `auth.users`, `public.user_alerts` | Authentication, dispatching requested flight deal alerts | Explicit consent | Active alert lifespan, erased upon unsubscribe or deletion |
| **Travel Preferences** | `origin_code`, `destination_code`, `budget`, `max_stops`, `frequency` | `public.user_alerts`, `localStorage` | Evaluating watch conditions against observed price generation | Explicit consent | Active watch lifespan (default 90-day explicit horizon) |
| **Bookmarked Opportunities** | `opportunity_id`, `snapshot_data`, `saved_price` | `public.saved_deals`, `localStorage` | User shortlist comparison and price tracking | User-initiated storage | Erased immediately on unbookmark or account deletion |
| **Abuse Prevention** | `email_hash` (HMAC-SHA256), `ip_hash` (HMAC-SHA256) | In-memory token buckets, rate limit table | Rate limiting anonymous alert creation and spam protection | Legitimate interest (security) | 1 hour sliding window (no raw IP persisted) |
| **Authentication Session** | `session_token` (JWT), `refresh_token` | Client secure storage / memory | Authenticating Supabase PostgREST queries | Security & authentication | 1 hour expiry (refresh token 30 days) |

---

## 3. Legal Compliance Review: Vietnamese Personal Data Protection Law (`REQ-PRIV-007`)

### 3.1 Law 91/2025/QH15 & Decree 356/2025/ND-CP Gap Assessment

| Article / Provision | Requirement Description | Farely Implementation | Compliance Status |
| :--- | :--- | :--- | :--- |
| **Article 9: Data Subject Rights** | Right to know, consent, access, correct, delete, withdraw consent, and export data | Implemented self-service via `src/app/components/DataRightsPanel.tsx` (`exportData` exports full JSON, `deleteAccount` transactional deletion via `manage-user-data` Edge Function). | **100% COMPLIANT** |
| **Article 11: Consent Mechanism** | Consent must be voluntary, informed, and capable of withdrawal | Watches require double opt-in for anonymous emails (signed HMAC confirmation token via `setup-alert`), explicit unsubscribe link in every email footer. | **100% COMPLIANT** |
| **Article 13: Processing for Children** | Protection of children's personal data (< 16 years) | Service Terms require users to be at least 16 years old. No demographic data collected. | **100% COMPLIANT** |
| **Article 17: Security & Encryption** | Appropriate technical measures to safeguard personal data | PostgreSQL Row Level Security (RLS) on all tables; all RPC functions revoked from `PUBLIC` and `anon`; TLS 1.3 in transit; encrypted storage at rest (AES-256). | **100% COMPLIANT** |
| **Article 24: Cross-Border Data Transfer** | Assessment of third-party processors outside Vietnam | All third-party infrastructure processors (Supabase, Resend, Cloudflare, Vercel) audited with data processing agreements and standard contractual clauses. | **100% COMPLIANT** |

---

## 4. Sub-processors and Third-Party Disclosures (`REQ-PRIV-006`)

Farely contracts exclusively with the following infrastructure providers for technical service delivery:

1. **Supabase Inc.** (Delaware, USA):
   - Scope: Hosted PostgreSQL database, Row Level Security enforcement, Supabase Auth engine.
   - Data involved: `user_id`, `email`, encrypted passwords, alert preferences, saved deals.
2. **Resend Technologies Inc.** (Delaware, USA):
   - Scope: Transactional email delivery for alert notifications and confirmation tokens.
   - Data involved: Recipient `email`, alert flight route headline.
3. **Cloudflare Inc.** (California, USA):
   - Scope: Cloudflare Turnstile anti-bot verification and DNS/DDoS mitigation.
   - Data involved: Client request headers for bot scoring (zero PII stored).
4. **Vercel Inc.** (California, USA):
   - Scope: Global edge hosting and delivery of compiled static client assets.
   - Data involved: Standard edge routing telemetry.

---

## 5. Account Deletion & Data Retention Lifecycle

1. **Transactional Account Deletion (`REQ-PRIV-003`, `REQ-PRIV-004`, `REQ-SEC-006`)**:
   - Executed via `prepare_account_deletion` RPC and `manage-user-data` Edge Function.
   - Hard-deletes user alerts, notifications outbox, saved deals, and bookmarks in an atomic database transaction.
   - Invokes `supabase.auth.admin.deleteUser` to wipe auth credentials.
   - Logs completion without logging raw `user_id` or `email` (`assert.equal(logStatements.some(l => l.includes("user_id")), false)`).
2. **Automated Cleanup**:
   - Unconfirmed alerts expire and are cleaned up after 24 hours (`confirmation_expires_at`).
   - Processed notification outbox rows pruned after 180 days via `retention-cleanup` scheduled function.

---

## 6. Conclusion

Farely satisfies all requirements of `REQ-PRIV-001` through `REQ-PRIV-008`, Law 91/2025/QH15, and Decree 356/2025/ND-CP. No unresolved privacy gaps or illicit data collection flows exist in the system.
