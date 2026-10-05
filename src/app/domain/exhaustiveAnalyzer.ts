/**
 * Domain keyset iterator for exhaustive bounded-safe data processing.
 * Solves the Section 27 requirement: no 300-row ceiling, no tied-timestamp loss.
 */

export interface KeysetRow {
  id: string;
  timestamp: string;
  [key: string]: unknown;
}

export interface KeysetCursor {
  cursor_timestamp: string;
  cursor_id: string;
}

export interface KeysetPageResult<T extends KeysetRow> {
  rows: T[];
  hasMore: boolean;
  isPartial: boolean;
  continuation: KeysetCursor | null;
}

/**
 * Filter and paginate a sorted list using stable keyset (timestamp desc, id desc).
 */
export function paginateKeyset<T extends KeysetRow>(
  rows: T[],
  cursor?: KeysetCursor | null,
  limit = 300,
): T[] {
  let filtered = rows;
  if (cursor?.cursor_timestamp && cursor?.cursor_id) {
    filtered = rows.filter((r) => {
      if (r.timestamp < cursor.cursor_timestamp) return true;
      if (r.timestamp === cursor.cursor_timestamp) return r.id < cursor.cursor_id;
      return false;
    });
  } else if (cursor?.cursor_timestamp) {
    filtered = rows.filter((r) => r.timestamp < cursor.cursor_timestamp);
  }
  return filtered.slice(0, limit);
}

/**
 * Exhaustively collect rows from a paginated fetcher with bounded safety.
 */
export async function collectExhaustiveKeyset<T extends KeysetRow>(
  fetchPage: (cursor: KeysetCursor | null, batchLimit: number) => Promise<T[]>,
  options: {
    pageSize?: number;
    maxRows?: number;
    initialCursor?: KeysetCursor | null;
  } = {},
): Promise<KeysetPageResult<T>> {
  const pageSize = options.pageSize ?? 300;
  const maxRows = options.maxRows ?? 5000;
  let cursor = options.initialCursor ?? null;

  const collected: T[] = [];
  let hasMore = true;
  let isPartial = false;

  while (hasMore && collected.length < maxRows) {
    const batchLimit = Math.min(pageSize, maxRows - collected.length);
    const batch = await fetchPage(cursor, batchLimit);

    if (!batch || batch.length === 0) {
      hasMore = false;
      break;
    }

    collected.push(...batch);

    const last = batch[batch.length - 1];
    cursor = {
      cursor_timestamp: last.timestamp,
      cursor_id: last.id,
    };

    if (batch.length < batchLimit) {
      hasMore = false;
      break;
    }
  }

  if (hasMore && collected.length >= maxRows) {
    isPartial = true;
  }

  return {
    rows: collected,
    hasMore,
    isPartial,
    continuation: hasMore ? cursor : null,
  };
}
