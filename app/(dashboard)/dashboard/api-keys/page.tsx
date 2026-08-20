import { Suspense } from "react";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { ApiKeyList } from "@/components/api-keys/api-key-list";
import { CreateApiKeyButton } from "@/components/api-keys/create-api-key-button";
import { McpConnectCard } from "@/components/api-keys/mcp-connect-card";

export default async function ApiKeysPage() {
  const session = await requireAuth();

  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      key: true,
      name: true,
      lastUsed: true,
      usageCount: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  // The full key is only shown once, at creation — the list gets a mask.
  const maskedKeys = apiKeys.map((k) => ({
    ...k,
    key: `${k.key.slice(0, 6)}••••••••${k.key.slice(-4)}`,
  }));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">API Keys</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage your API keys for authenticated endpoints
          </p>
        </div>
        <CreateApiKeyButton />
      </div>

      <McpConnectCard
        baseUrl={process.env.BETTER_AUTH_URL || "http://localhost:3000"}
      />

      <Suspense fallback={<div className="text-zinc-400">Loading...</div>}>
        <ApiKeyList initialKeys={maskedKeys} />
      </Suspense>
    </div>
  );
}
