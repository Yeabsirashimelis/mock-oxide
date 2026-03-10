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
  return (
    <div className="space-y-3">
      {endpoints.map((endpoint) => (
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
              {endpoint.responseCode !== 200 && (
                <span>{endpoint.responseCode}</span>
              )}
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
  );
}
