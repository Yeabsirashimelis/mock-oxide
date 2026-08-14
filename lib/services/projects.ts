import { createProject } from "@/lib/db";
import { ConflictError, ValidationError } from "./errors";
import { isUniqueConstraintError } from "./prisma";

export interface CreateProjectInput {
  name?: string;
  slug?: string;
  description?: string;
}

/**
 * Creates a project owned by `userId`. Validates required fields and maps a
 * duplicate slug to a ConflictError. Callable from any transport (web route,
 * MCP server) — it takes a userId rather than reading a session.
 */
export async function createProjectForUser(
  userId: string,
  input: CreateProjectInput
) {
  const name = input.name?.trim();
  const slug = input.slug?.trim();

  if (!name || !slug) {
    throw new ValidationError("Name and slug are required");
  }

  try {
    return await createProject(userId, {
      name,
      slug,
      description: input.description,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ConflictError("A project with this slug already exists");
    }
    throw error;
  }
}
