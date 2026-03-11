"use client";

import { useState } from "react";

interface Request {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  ip: string | null;
  createdAt: Date;
  endpoint: {
    path: string;
    method: string;
    name: string | null;
  };
}

interface RequestsTableProps {
  requests: Request[];
}

export function RequestsTable({ requests }: RequestsTableProps) {
  const [filter, setFilter] = useState<string>("all");

  if (requests.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center">
        <p className="text-sm text-zinc-500">No requests recorded yet</p>
      </div>
    );
  }

  const filteredRequests = requests.filter((req) => {
    if (filter === "all") return true;
    if (filter === "2xx") return req.statusCode >= 200 && req.statusCode < 300;
    if (filter === "4xx") return req.statusCode >= 400 && req.statusCode < 500;
    if (filter === "5xx") return req.statusCode >= 500;
    return true;
  });

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return "text-green-400";
    if (code >= 300 && code < 400) return "text-blue-400";
    if (code >= 400 && code < 500) return "text-yellow-400";
    return "text-red-400";
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "POST":
        return "text-green-400 bg-green-500/10 border-green-500/20";
      case "PUT":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "PATCH":
        return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      case "DELETE":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      default:
        return "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      {/* Filter Bar */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-3">
        <span className="text-sm text-zinc-400">Filter:</span>
        <div className="flex gap-2">
          {[
            { value: "all", label: "All" },
            { value: "2xx", label: "2xx Success" },
            { value: "4xx", label: "4xx Errors" },
            { value: "5xx", label: "5xx Errors" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                filter === option.value
                  ? "bg-blue-600 text-white"
                  : "text-zinc-400 hover:text-zinc-100 border border-zinc-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-zinc-500 ml-auto">
          Showing {filteredRequests.length} of {requests.length} requests
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-950 border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">
                Method
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">
                Endpoint
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">
                Duration
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">
                IP
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filteredRequests.map((request) => (
              <tr key={request.id} className="hover:bg-zinc-950 transition-colors">
                <td className="px-4 py-3 text-sm text-zinc-400 font-mono">
                  {formatDate(request.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded border ${getMethodColor(
                      request.endpoint.method
                    )}`}
                  >
                    {request.endpoint.method}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm text-zinc-100 font-mono">
                      {request.endpoint.path}
                    </span>
                    {request.endpoint.name && (
                      <span className="text-xs text-zinc-500">
                        {request.endpoint.name}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-mono font-medium ${getStatusColor(request.statusCode)}`}>
                    {request.statusCode}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-300 font-mono">
                  {request.duration}ms
                </td>
                <td className="px-4 py-3 text-sm text-zinc-400 font-mono">
                  {request.ip || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRequests.length === 0 && (
        <div className="p-6 text-center">
          <p className="text-sm text-zinc-500">No requests match the current filter</p>
        </div>
      )}
    </div>
  );
}
