/**
 * Typed errors for the service layer.
 *
 * Service functions are framework-agnostic: they throw these errors instead of
 * returning HTTP responses, so the same function can be called from a Next.js
 * route handler (session auth) or the MCP server (API-key auth). Each transport
 * maps the error to its own response format via the `status`/`code` fields.
 */
export class ServiceError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
  }
}

/** Invalid or missing input (400). */
export class ValidationError extends ServiceError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

/** The requested resource does not exist (404). */
export class NotFoundError extends ServiceError {
  constructor(message = "Not found") {
    super(message, 404, "NOT_FOUND");
  }
}

/** The caller is authenticated but not allowed to act on this resource (403). */
export class ForbiddenError extends ServiceError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

/** The action conflicts with existing state, e.g. a duplicate slug (409). */
export class ConflictError extends ServiceError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}
