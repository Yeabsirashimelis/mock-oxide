"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Endpoint } from "@/app/generated/prisma/client";

interface EndpointListProps {
  endpoints: Endpoint[];
  projectSlug: string;
}

const methodColors: Record<string, string> = {
  GET: "text-green-400 bg-green-500/10 border-green-500/20",
  POST: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  PUT: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  PATCH: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  DELETE: "text-red-400 bg-red-500/10 border-red-500/20",
};

export function EndpointList({ endpoints, projectSlug }: EndpointListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [showDisabled, setShowDisabled] = useState(true);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const handleDuplicate = async (e: React.MouseEvent, endpointId: string) => {
    e.preventDefault();
    e.stopPropagation();

    setDuplicating(endpointId);

    try {
      const response = await fetch(`/api/projects/${projectSlug}/endpoints/${endpointId}/duplicate`, {
        method: "POST",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to duplicate endpoint");
      }
    } catch (error) {
      alert("Failed to duplicate endpoint");
      console.error(error);
    } finally {
      setDuplicating(null);
    }
  };

  // Filter endpoints
  const filteredEndpoints = endpoints.filter((endpoint) => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      endpoint.path.toLowerCase().includes(searchLower) ||
      endpoint.name?.toLowerCase().includes(searchLower) ||
      endpoint.description?.toLowerCase().includes(searchLower);

    // Method filter
    const matchesMethod = !selectedMethod || endpoint.method === selectedMethod;

    // Enabled filter
    const matchesEnabled = showDisabled || endpoint.enabled;

    return matchesSearch && matchesMethod && matchesEnabled;
  });

  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  const methodCounts = methods.map((method) => ({
    method,
    count: endpoints.filter((e) => e.method === method).length,
  }));

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
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
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search endpoints by path, name, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Method Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-zinc-400">Filter by method:</span>
          <button
            onClick={() => setSelectedMethod(null)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              selectedMethod === null
                ? "bg-blue-600 text-white"
                : "text-zinc-400 hover:text-zinc-100 border border-zinc-700"
            }`}
          >
            All ({endpoints.length})
          </button>
          {methodCounts
            .filter((m) => m.count > 0)
            .map(({ method, count }) => (
              <button
                key={method}
                onClick={() => setSelectedMethod(selectedMethod === method ? null : method)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors border ${
                  selectedMethod === method
                    ? methodColors[method]
                    : "text-zinc-400 hover:text-zinc-100 border-zinc-700"
                }`}
              >
                {method} ({count})
              </button>
            ))}

          <div className="ml-auto flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showDisabled}
                onChange={(e) => setShowDisabled(e.target.checked)}
                className="w-4 h-4 bg-zinc-900 border-zinc-700 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              Show disabled
            </label>
          </div>
        </div>

        {/* Results count */}
        {(searchQuery || selectedMethod || !showDisabled) && (
          <div className="text-sm text-zinc-500">
            Showing {filteredEndpoints.length} of {endpoints.length} endpoints
          </div>
        )}
      </div>

      {/* Endpoint List */}
      {filteredEndpoints.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg">
          <p className="text-zinc-400">No endpoints match your filters</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedMethod(null);
              setShowDisabled(true);
            }}
            className="mt-2 text-sm text-blue-400 hover:text-blue-300"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEndpoints.map((endpoint) => (
        <Link
          key={endpoint.id}
          href={`/dashboard/projects/${projectSlug}/endpoints/${endpoint.id}`}
          className="block p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <span
                className={`px-2 py-1 text-xs font-medium rounded border ${
                  methodColors[endpoint.method] || methodColors.GET
                }`}
              >
                {endpoint.method}
              </span>
              <code className="text-sm font-mono text-zinc-100 group-hover:text-blue-400 transition-colors">
                {endpoint.path}
              </code>
              {!endpoint.enabled && (
                <span className="px-2 py-0.5 text-xs text-zinc-500 bg-zinc-800 rounded">
                  Disabled
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-500">
              {endpoint.isArray && (
                <span className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="7" height="7" x="3" y="3" rx="1" />
                    <rect width="7" height="7" x="14" y="3" rx="1" />
                    <rect width="7" height="7" x="14" y="14" rx="1" />
                    <rect width="7" height="7" x="3" y="14" rx="1" />
                  </svg>
                  Array
                </span>
              )}
              {endpoint.stateful && (
                <span className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  CRUD
                </span>
              )}
              {endpoint.authRequired && (
                <span className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Auth
                </span>
              )}
              {endpoint.rateLimit && (
                <span className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {endpoint.rateLimit}/min
                </span>
              )}
              {endpoint.responseCode !== 200 && (
                <span>{endpoint.responseCode}</span>
              )}
              <button
                onClick={(e) => handleDuplicate(e, endpoint.id)}
                disabled={duplicating === endpoint.id}
                className="ml-2 p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Duplicate endpoint"
              >
                {duplicating === endpoint.id ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-spin"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {endpoint.description && (
            <p className="mt-2 text-sm text-zinc-400 line-clamp-1">
              {endpoint.description}
            </p>
          )}
        </Link>
      ))}
        </div>
      )}
    </div>
  );
}
