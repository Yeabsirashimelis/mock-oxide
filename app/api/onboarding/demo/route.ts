import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { createProjectForUser } from "@/lib/services/projects";
import { createEndpointForUser } from "@/lib/services/endpoints";
import { ConflictError } from "@/lib/services/errors";
import { toErrorResponse } from "@/lib/services/http";

/**
 * Seeds a small demo project for the signed-in user so a fresh account can
 * see working endpoints in one click. Slugs are globally unique, so on a
 * collision we retry once with a random suffix.
 */
export async function POST() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    let project;
    try {
      project = await createProjectForUser(userId, {
        name: "Demo Store",
        slug: "demo-store",
        description: "A sample e-commerce API — explore, edit or delete it",
      });
    } catch (error) {
      if (!(error instanceof ConflictError)) throw error;
      const suffix = Math.random().toString(36).slice(2, 6);
      project = await createProjectForUser(userId, {
        name: "Demo Store",
        slug: `demo-store-${suffix}`,
        description: "A sample e-commerce API — explore, edit or delete it",
      });
    }

    const slug = project.slug;

    await createEndpointForUser(userId, slug, {
      name: "List products",
      path: "/products",
      method: "GET",
      schema: {
        id: "uuid",
        name: "productName",
        price: "price",
        category: "category",
        imageUrl: "imageUrl",
        rating: "number:1-5",
        inStock: "boolean",
      },
      isArray: true,
      arrayCount: 12,
      pagination: true,
      enabled: true,
    });

    await createEndpointForUser(userId, slug, {
      name: "Get product",
      path: "/products/:id",
      method: "GET",
      description: "The id in the URL is echoed into the response",
      schema: {
        id: "uuid",
        name: "productName",
        description: "productDescription",
        price: "price",
        stock: "integer:0-100",
      },
      enabled: true,
    });

    await createEndpointForUser(userId, slug, {
      name: "Get user",
      path: "/users/:id",
      method: "GET",
      schema: {
        id: "uuid",
        name: "fullName",
        email: "email",
        avatar: "avatar",
        address: { city: "city", country: "country" },
      },
      enabled: true,
    });

    await createEndpointForUser(userId, slug, {
      name: "Place order",
      path: "/orders",
      method: "POST",
      description: "Validates the request body against the schema",
      schema: {
        orderId: "uuid",
        items: "array:productName:3",
        total: "price",
        status: "enum:pending,shipped,delivered",
      },
      responseCode: 201,
      validateRequest: true,
      enabled: true,
    });

    return NextResponse.json({ slug }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
