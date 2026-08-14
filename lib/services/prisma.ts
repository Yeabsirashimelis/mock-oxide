/**
 * Detects a Prisma unique-constraint violation (P2002) so services can
 * translate it into a ConflictError. Falls back to a message check for
 * environments where the structured code isn't present.
 */
export function isUniqueConstraintError(error: unknown): boolean {
  if (error && typeof error === "object" && "code" in error) {
    return (error as { code?: string }).code === "P2002";
  }
  return error instanceof Error && error.message.includes("Unique constraint");
}
