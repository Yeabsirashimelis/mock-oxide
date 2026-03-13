"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ImportOpenAPIModalProps {
  projectSlug: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImportOpenAPIModal({
  projectSlug,
  isOpen,
  onClose,
}: ImportOpenAPIModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [skipExisting, setSkipExisting] = useState(true);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    total: number;
    endpoints: Array<{ method: string; path: string; name: string }>;
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
      setError(null);
      setResult(null);
    };
    reader.onerror = () => {
      setError("Failed to read file");
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!content.trim()) {
      setError("Please provide an OpenAPI spec");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/projects/${projectSlug}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          skipExisting,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import OpenAPI spec");
      }

      setResult(data);
      router.refresh();

      // Auto-close after successful import
      if (data.imported > 0) {
        setTimeout(() => {
          onClose();
          setContent("");
          setResult(null);
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-100">Import from OpenAPI</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!result ? (
            <>
              <p className="text-sm text-zinc-400">
                Import endpoints from an OpenAPI 3.0 or Swagger 2.0 specification. Upload a
                JSON/YAML file or paste the spec content below.
              </p>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Upload OpenAPI File
                </label>
                <input
                  type="file"
                  accept=".json,.yaml,.yml"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-zinc-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded file:border-0
                    file:text-sm file:font-medium
                    file:bg-zinc-800 file:text-zinc-300
                    hover:file:bg-zinc-700 file:transition-colors
                    cursor-pointer"
                />
              </div>

              {/* Or Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-xs text-zinc-500">OR</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>

              {/* Text Area */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Paste OpenAPI Spec (JSON or YAML)
                </label>
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setError(null);
                    setResult(null);
                  }}
                  placeholder='{"openapi": "3.0.0", "info": {...}, "paths": {...}}'
                  className="w-full h-64 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-zinc-100 text-sm font-mono placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Options */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="skipExisting"
                  checked={skipExisting}
                  onChange={(e) => setSkipExisting(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="skipExisting" className="text-sm text-zinc-300">
                  Skip endpoints that already exist (same method + path)
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Success Result */}
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-400 font-medium mb-2">
                  Import Successful!
                </p>
                <div className="text-xs text-green-300 space-y-1">
                  <p>Imported: {result.imported} endpoint(s)</p>
                  {result.skipped > 0 && <p>Skipped: {result.skipped} existing endpoint(s)</p>}
                  <p>Total: {result.total} endpoint(s) in spec</p>
                </div>
              </div>

              {/* Imported Endpoints */}
              {result.endpoints.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-zinc-300 mb-2">
                    Imported Endpoints:
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {result.endpoints.map((endpoint, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-zinc-950 border border-zinc-800 rounded text-xs"
                      >
                        <span className={`px-2 py-1 rounded font-medium ${
                          endpoint.method === "GET"
                            ? "text-green-400 bg-green-500/10"
                            : endpoint.method === "POST"
                            ? "text-blue-400 bg-blue-500/10"
                            : endpoint.method === "PUT"
                            ? "text-yellow-400 bg-yellow-500/10"
                            : endpoint.method === "PATCH"
                            ? "text-orange-400 bg-orange-500/10"
                            : "text-red-400 bg-red-500/10"
                        }`}>
                          {endpoint.method}
                        </span>
                        <code className="font-mono text-zinc-300">{endpoint.path}</code>
                        <span className="text-zinc-500">-</span>
                        <span className="text-zinc-400">{endpoint.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-zinc-500">
                Closing automatically in 3 seconds...
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        {!result && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-zinc-300 hover:text-zinc-100 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={isLoading || !content.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? "Importing..." : "Import Endpoints"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
