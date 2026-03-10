import * as dotenv from "dotenv";
dotenv.config();

async function createDemoUser() {
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";

  try {
    const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "demo@example.com",
        password: "demo123",
        name: "Demo User",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Failed to create demo user:", data);
      return;
    }

    console.log("✅ Demo user created successfully!");
    console.log("\n📧 Demo Credentials:");
    console.log("   Email:    demo@example.com");
    console.log("   Password: demo123\n");
  } catch (error) {
    console.error("❌ Error creating demo user:", error);
  }
}

createDemoUser();
