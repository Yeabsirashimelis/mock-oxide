import { Suspense } from "react";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { ApiKeyList } from "@/components/api-keys/api-key-list";
import { CreateApiKeyButton } from "@/components/api-keys/create-api-key-button";

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

      <Suspense fallback={<div className="text-zinc-400">Loading...</div>}>
        <ApiKeyList initialKeys={apiKeys} />
      </Suspense>
    </div>
  );
}
