const CLIENT_ISSUE_PATTERN = /^[a-z][a-z0-9_]{2,63}$/;

/**
 * Emit a low-cardinality, PII-free browser diagnostic. Error objects and
 * free-form context are intentionally not accepted by this boundary.
 */
export function reportClientIssue(issueCode: string): void {
  const code = CLIENT_ISSUE_PATTERN.test(issueCode) ? issueCode : "client_issue_invalid_code";
  console.warn(JSON.stringify({ event: "client_issue", code }));
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
