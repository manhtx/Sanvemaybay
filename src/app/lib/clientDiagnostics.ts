const CLIENT_ISSUE_PATTERN = /^[a-z][a-z0-9_]{2,63}$/;
const MSG_CACHE = new Map<string, string>();

let lastIssueTick = 0;
let tickReportCount = 0;

/**
 * Emit a low-cardinality, PII-free browser diagnostic. Error objects and
 * free-form context are intentionally not accepted by this boundary.
 */
export function reportClientIssue(issueCode: string): void {
  const now = Date.now();
  if (now === lastIssueTick) {
    tickReportCount++;
    if (tickReportCount > 25) return;
  } else {
    lastIssueTick = now;
    tickReportCount = 1;
  }

  let msg = MSG_CACHE.get(issueCode);
  if (msg === undefined) {
    const code = CLIENT_ISSUE_PATTERN.test(issueCode) ? issueCode : "client_issue_invalid_code";
    msg = `{"event":"client_issue","code":"${code}"}`;
    if (MSG_CACHE.size < 500) {
      MSG_CACHE.set(issueCode, msg);
    }
  }
  console.warn(msg);
}

export class PublicClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "PublicClientError";
  }
}
