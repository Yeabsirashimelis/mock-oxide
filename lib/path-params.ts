/**
 * Dynamic path parameter matching for mock endpoints.
 *
 * Endpoint paths may declare parameter segments in either Express style
 * (`/users/:id`) or OpenAPI style (`/users/{id}`) — the latter means specs
 * imported via the OpenAPI importer work without rewriting. A parameter
 * matches exactly one path segment; there are no wildcards or optional
 * segments.
 */

const PARAM_SEGMENT = /^(?::(\w+)|\{(\w+)\})$/;

function segments(path: string): string[] {
  return path.split("/").filter(Boolean);
}

/** Returns the parameter name if the segment is `:name` or `{name}`, else null. */
function paramName(segment: string): string | null {
  const match = PARAM_SEGMENT.exec(segment);
  return match ? match[1] ?? match[2] : null;
}

/** True if the endpoint path declares at least one parameter segment. */
export function isParameterizedPath(path: string): boolean {
  return segments(path).some((s) => paramName(s) !== null);
}

/**
 * Matches a concrete request path against an endpoint's path pattern.
 * Returns the extracted parameters, or null if the pattern doesn't match.
 * Static segments compare exactly; parameter values are URI-decoded.
 */
export function matchPath(
  pattern: string,
  requestPath: string
): Record<string, string> | null {
  const patternSegs = segments(pattern);
  const requestSegs = segments(requestPath);

  if (patternSegs.length !== requestSegs.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternSegs.length; i++) {
    const name = paramName(patternSegs[i]);
    if (name !== null) {
      try {
        params[name] = decodeURIComponent(requestSegs[i]);
      } catch {
        params[name] = requestSegs[i];
      }
    } else if (patternSegs[i] !== requestSegs[i]) {
      return null;
    }
  }

  return params;
}

/** Parameter names declared in a path, in order (e.g. /users/:id -> ["id"]). */
export function pathParamNames(path: string): string[] {
  return segments(path)
    .map(paramName)
    .filter((n): n is string => n !== null);
}

/** Normalizes a path to OpenAPI style: /users/:id -> /users/{id}. */
export function toOpenAPIPath(path: string): string {
  return (
    "/" +
    segments(path)
      .map((s) => {
        const name = paramName(s);
        return name !== null ? `{${name}}` : s;
      })
      .join("/")
  );
}

/**
 * Picks the best-matching pattern for a request path from a list of
 * candidates. More static segments beats fewer (`/users/me` style exact
 * segments outrank `/users/:id`); on a tie the earlier candidate wins, so
 * callers should pass candidates in a deterministic order.
 */
export function findBestMatch<T extends { path: string }>(
  candidates: T[],
  requestPath: string
): { endpoint: T; params: Record<string, string> } | null {
  let best: { endpoint: T; params: Record<string, string> } | null = null;
  let bestParamCount = Infinity;

  for (const candidate of candidates) {
    const params = matchPath(candidate.path, requestPath);
    if (params === null) continue;

    const paramCount = Object.keys(params).length;
    if (paramCount < bestParamCount) {
      best = { endpoint: candidate, params };
      bestParamCount = paramCount;
    }
  }

  return best;
}
