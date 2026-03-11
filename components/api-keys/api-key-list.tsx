"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CopyButton } from "@/components/ui/copy-button";

interface ApiKey {
  id: string;
  key: string;
  name: string;
  lastUsed: Date | null;
  usageCount: number;
  createdAt: Date;
  expiresAt: Date | null;
}

interface ApiKeyListProps {
  initialKeys: ApiKey[];
}

export function ApiKeyList({ initialKeys }: ApiKeyListProps) {
  const router = useRouter();
  const [keys, setKeys] = useState(initialKeys);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(id);

    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setKeys((prev) => prev.filter((key) => key.id !== id));
      } else {
        alert("Failed to delete API key");
      }
    } catch (error) {
      alert("Failed to delete API key");
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (keys.length === 0) {
    return (
      <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg">
        <div className="text-zinc-400 mb-2">No API keys yet</div>
        <p className="text-sm text-zinc-500">
          Create an API key to use with authenticated endpoints
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {keys.map((apiKey) => (
        <div
          key={apiKey.id}
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-zinc-100 mb-1">
                {apiKey.name}
              </h3>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-zinc-400 bg-zinc-950 px-2 py-1 rounded">
                  {apiKey.key}
                </code>
                <CopyButton text={apiKey.key} />
              </div>
            </div>
            <button
              onClick={() => handleDelete(apiKey.id, apiKey.name)}
              disabled={deleting === apiKey.id}
              className="text-sm text-zinc-400 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deleting === apiKey.id ? "Deleting..." : "Delete"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-zinc-500">Usage:</span>
              <span className="ml-2 text-zinc-300">
                {apiKey.usageCount.toLocaleString()} requests
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Last used:</span>
              <span className="ml-2 text-zinc-300">{formatDate(apiKey.lastUsed)}</span>
            </div>
            <div>
              <span className="text-zinc-500">Created:</span>
              <span className="ml-2 text-zinc-300">{formatDate(apiKey.createdAt)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
