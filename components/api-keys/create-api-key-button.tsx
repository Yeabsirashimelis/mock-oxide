"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CopyButton } from "@/components/ui/copy-button";

export function CreateApiKeyButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Holds the freshly created key for the one-time reveal.
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setName("");
        setCreatedKey(data.key);
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create API key");
      }
    } catch (err) {
      setError("Failed to create API key");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setName("");
    setError(null);
    setCreatedKey(null);
  };

  const mcpCommand = createdKey
    ? `claude mcp add --transport http mock-oxide ${window.location.origin}/api/mcp --header "Authorization: Bearer ${createdKey}"`
    : "";

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Create API Key
      </button>

      {isOpen && createdKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold text-zinc-100 mb-1">
              API key created
            </h2>
            <p className="text-sm text-amber-400 mb-4">
              Copy it now — for security it won&apos;t be shown again.
            </p>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Your API key</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-sm font-mono text-zinc-100 break-all">
                    {createdKey}
                  </code>
                  <CopyButton text={createdKey} />
                </div>
              </div>

              <div>
                <p className="text-xs text-zinc-500 mb-1">
                  Connect Claude Code with this key
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-xs font-mono text-zinc-300 overflow-x-auto whitespace-nowrap">
                    {mcpCommand}
                  </code>
                  <CopyButton text={mcpCommand} />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isOpen && !createdKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">
              Create New API Key
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  placeholder="Production API Key"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleCreate}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  {isLoading ? "Creating..." : "Create Key"}
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setName("");
                    setError(null);
                  }}
                  className="px-4 py-2 border border-zinc-700 hover:border-zinc-600 text-zinc-300 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
