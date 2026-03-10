// Load environment variables
import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Get or create first user
  let user = await prisma.user.findFirst();

  if (!user) {
    console.log("⚠️  No user found. Please sign up first at /sign-up");
    console.log("   Then run this seed script again.\n");
    return;
  }

  console.log("✅ Using user:", user.email);

  // Create demo projects
  const ecommerceProject = await prisma.project.upsert({
    where: { slug: "ecommerce-api" },
    update: {},
    create: {
      name: "E-Commerce API",
      slug: "ecommerce-api",
      description: "Mock API for an online store with products, orders, and users",
      userId: user.id,
    },
  });

  const blogProject = await prisma.project.upsert({
    where: { slug: "blog-api" },
    update: {},
    create: {
      name: "Blog API",
      slug: "blog-api",
      description: "Simple blog API with posts, comments, and authors",
      userId: user.id,
    },
  });

  console.log("✅ Created projects:", ecommerceProject.name, blogProject.name);

  // Create endpoints for E-Commerce API
  await prisma.endpoint.upsert({
    where: {
      projectId_path_method: {
        projectId: ecommerceProject.id,
        path: "/products",
        method: "GET",
      },
    },
    update: {},
    create: {
      name: "Get Products",
      path: "/products",
      method: "GET",
      description: "Returns a paginated list of products",
      projectId: ecommerceProject.id,
      schema: {
        id: "uuid",
        name: "productName",
        description: "productDescription",
        price: "price",
        category: "category",
        inStock: "boolean",
        rating: "number:1-5",
        imageUrl: "imageUrl",
        createdAt: "datetime",
      },
      isArray: true,
      arrayCount: 20,
      pagination: true,
      responseCode: 200,
      enabled: true,
    },
  });

  await prisma.endpoint.upsert({
    where: {
      projectId_path_method: {
        projectId: ecommerceProject.id,
        path: "/users",
        method: "GET",
      },
    },
    update: {},
    create: {
      name: "Get Users",
      path: "/users",
      method: "GET",
      description: "Returns a list of registered users",
      projectId: ecommerceProject.id,
      schema: {
        id: "uuid",
        name: "fullName",
        email: "email",
        avatar: "avatar",
        role: "enum:admin,customer,guest",
        isActive: "boolean",
        createdAt: "datetime",
      },
      isArray: true,
      arrayCount: 15,
      responseCode: 200,
      enabled: true,
    },
  });

  await prisma.endpoint.upsert({
    where: {
      projectId_path_method: {
        projectId: ecommerceProject.id,
        path: "/orders",
        method: "POST",
      },
    },
    update: {},
    create: {
      name: "Create Order",
      path: "/orders",
      method: "POST",
      description: "Create a new order (stateful)",
      projectId: ecommerceProject.id,
      schema: {
        orderId: "uuid",
        userId: "uuid",
        items: "array:product:3",
        total: "price",
        status: "enum:pending,processing,shipped,delivered",
        createdAt: "datetime",
      },
      stateful: true,
      responseCode: 201,
      enabled: true,
    },
  });

  // Create endpoints for Blog API
  await prisma.endpoint.upsert({
    where: {
      projectId_path_method: {
        projectId: blogProject.id,
        path: "/posts",
        method: "GET",
      },
    },
    update: {},
    create: {
      name: "Get Posts",
      path: "/posts",
      method: "GET",
      description: "Returns all blog posts with author info",
      projectId: blogProject.id,
      schema: {
        id: "uuid",
        title: "sentence",
        content: "paragraphs",
        author: {
          name: "fullName",
          email: "email",
          avatar: "avatar",
        },
        tags: "array:word:3",
        published: "boolean",
        views: "integer:100-10000",
        createdAt: "datetime",
      },
      isArray: true,
      arrayCount: 10,
      pagination: true,
      responseCode: 200,
      enabled: true,
    },
  });

  await prisma.endpoint.upsert({
    where: {
      projectId_path_method: {
        projectId: blogProject.id,
        path: "/comments",
        method: "GET",
      },
    },
    update: {},
    create: {
      name: "Get Comments",
      path: "/comments",
      method: "GET",
      description: "Returns comments for blog posts",
      projectId: blogProject.id,
      schema: {
        id: "uuid",
        postId: "uuid",
        author: "fullName",
        email: "email",
        content: "paragraph",
        approved: "boolean",
        createdAt: "datetime",
      },
      isArray: true,
      arrayCount: 25,
      responseCode: 200,
      enabled: true,
    },
  });

  await prisma.endpoint.upsert({
    where: {
      projectId_path_method: {
        projectId: blogProject.id,
        path: "/authors",
        method: "GET",
      },
    },
    update: {},
    create: {
      name: "Get Authors",
      path: "/authors",
      method: "GET",
      description: "Returns list of blog authors",
      projectId: blogProject.id,
      schema: {
        id: "uuid",
        name: "fullName",
        email: "email",
        bio: "paragraph",
        avatar: "avatar",
        socialLinks: {
          twitter: "url",
          github: "url",
          website: "url",
        },
        postCount: "integer:1-100",
        joinedAt: "datetime",
      },
      isArray: true,
      arrayCount: 5,
      responseCode: 200,
      delay: 500,
      enabled: true,
    },
  });

  console.log("✅ Created endpoints");

  // Create an API key for the demo user
  await prisma.apiKey.upsert({
    where: { key: "mk_demo_key_12345678901234567890" },
    update: {},
    create: {
      key: "mk_demo_key_12345678901234567890",
      name: "Demo API Key",
      userId: user.id,
      usageCount: 42,
      lastUsed: new Date(),
    },
  });

  console.log("✅ Created API key");

  console.log("\n🎉 Seeding complete!");
  console.log("\n📊 Sample Data Created for:", user.email);
  console.log("   - 2 Projects (E-Commerce API, Blog API)");
  console.log("   - 6 Endpoints total");
  console.log("   - 1 API Key\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
