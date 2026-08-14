import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { createEndpointForUser } from "@/lib/services/endpoints";
import { toErrorResponse } from "@/lib/services/http";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await req.json();

    const endpoint = await createEndpointForUser(session.user.id, slug, body);

    return NextResponse.json(endpoint, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
