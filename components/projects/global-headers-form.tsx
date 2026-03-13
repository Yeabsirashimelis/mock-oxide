"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface GlobalHeadersFormProps {
  projectSlug: string;
  initialHeaders: Record<string, string>;
}

export function GlobalHeadersForm({
  projectSlug,
  initialHeaders,
}: GlobalHeadersFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>(
    Object.entries(initialHeaders || {}).map(([key, value]) => ({ key, value }))
  );

  const handleAddHeader = () => {
    setHeaders((prev) => [...prev, { key: "", value: "" }]);
  };

  const handleHeaderChange = (index: number, field: "key" | "value", value: string) => {
    setHeaders((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleRemoveHeader = (index: number) => {
    setHeaders((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Convert headers array to object
      const headersObj = headers.reduce((acc, header) => {
        if (header.key.trim() && header.value.trim()) {
          acc[header.key.trim()] = header.value.trim();
        }
        return acc;
      }, {} as Record<string, string>);

      const response = await fetch(`/api/projects/${projectSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultHeaders: Object.keys(headersObj).length > 0 ? headersObj : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update headers");
      }

      setSuccess(true);
      router.refresh();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-zinc-300">
            Global Response Headers
          </label>
          <button
            type="button"
            onClick={handleAddHeader}
            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            + Add Header
          </button>
        </div>
        <p className="text-xs text-zinc-500 mb-3">
          These headers will be added to all endpoint responses. Endpoint-specific headers will override these.
        </p>

        {headers.length > 0 ? (
          <div className="space-y-2">
            {headers.map((header, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={header.key}
                  onChange={(e) => handleHeaderChange(index, "key", e.target.value)}
                  placeholder="Header-Name"
                  className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => handleHeaderChange(index, "value", e.target.value)}
                  placeholder="Header Value"
                  className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveHeader(index)}
                  className="px-2 py-2 text-zinc-400 hover:text-red-400 transition-colors"
                  title="Remove header"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 italic p-4 bg-zinc-950 border border-zinc-800 rounded">
            No global headers configured. Common examples: Cache-Control, X-API-Version
          </p>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-sm text-green-400">Headers saved successfully!</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
      >
        {isLoading ? "Saving..." : "Save Headers"}
      </button>
    </form>
  );
}
