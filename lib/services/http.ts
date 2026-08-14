import { NextResponse } from "next/server";
import { ServiceError } from "./errors";

/**
 * Maps a thrown error to a Next.js JSON response. Known `ServiceError`s use
 * their own status and message; anything else is treated as an unexpected
 * 500 and logged. Route handlers wrap service calls with this so error-to-HTTP
 * mapping lives in one place.
 */
export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof ServiceError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status }
    );
  }

  console.error("Unexpected error:", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
