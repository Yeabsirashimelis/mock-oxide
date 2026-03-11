"use client";

import { useState, useEffect } from "react";

interface Request {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  ip: string | null;
  userAgent: string | null;
  query: any;
  headers: any;
  body: any;
  createdAt: string;
}

interface EndpointLogsProps {
  projectSlug: string;
  endpointId: string;
}

export function EndpointLogs({ projectSlug, endpointId }: EndpointLogsProps) {
  const [logs, setLogs] = useState<Request[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<Request | null>(null);
  const [filters, setFilters] = useState({
    statusCode: "",
    method: "",
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.statusCode) params.set("statusCode", filters.statusCode);
      if (filters.method) params.set("method", filters.method);

      const response = await fetch(
        `/api/projects/${projectSlug}/endpoints/${endpointId}/logs?${params.toString()}`
      );
      const data = await response.json();

      if (response.ok) {
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const statusColors: Record<number, string> = {
    200: "text-green-400 bg-green-500/10",
    201: "text-green-400 bg-green-500/10",
    400: "text-yellow-400 bg-yellow-500/10",
    401: "text-orange-400 bg-orange-500/10",
    403: "text-orange-400 bg-orange-500/10",
    404: "text-red-400 bg-red-500/10",
    500: "text-red-400 bg-red-500/10",
  };

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return statusColors[200];
    if (code >= 400 && code < 500) return statusColors[400];
    if (code >= 500) return statusColors[500];
    return "text-zinc-400 bg-zinc-500/10";
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <select
          value={filters.statusCode}
          onChange={(e) => setFilters({ ...filters, statusCode: e.target.value })}
          className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status Codes</option>
          <option value="200">200 OK</option>
          <option value="201">201 Created</option>
          <option value="400">400 Bad Request</option>
          <option value="401">401 Unauthorized</option>
          <option value="403">403 Forbidden</option>
          <option value="404">404 Not Found</option>
          <option value="500">500 Internal Error</option>
        </select>

        <select
          value={filters.method}
          onChange={(e) => setFilters({ ...filters, method: e.target.value })}
          className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Methods</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>

        <div className="ml-auto text-sm text-zinc-400">
          {total} total requests
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg">
          <p className="text-zinc-400">Loading logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg">
          <p className="text-zinc-400">No requests logged yet</p>
          <p className="text-sm text-zinc-500 mt-2">
            Make a request to this endpoint to see logs appear here
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800/50 border-b border-zinc-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    IP
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-zinc-300">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-zinc-400">
                        {log.method}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                          log.statusCode
                        )}`}
                      >
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">
                      {log.duration}ms
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400 font-mono">
                      {log.ip || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-100">Request Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
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

            <div className="p-6 space-y-6">
              {/* Overview */}
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-2">Overview</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500">Time:</span>
                    <span className="ml-2 text-zinc-100">
                      {new Date(selectedLog.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Method:</span>
                    <span className="ml-2 text-zinc-100">{selectedLog.method}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Status:</span>
                    <span className="ml-2 text-zinc-100">{selectedLog.statusCode}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Duration:</span>
                    <span className="ml-2 text-zinc-100">{selectedLog.duration}ms</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">IP:</span>
                    <span className="ml-2 text-zinc-100 font-mono">
                      {selectedLog.ip || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Path:</span>
                    <span className="ml-2 text-zinc-100 font-mono">
                      {selectedLog.path}
                    </span>
                  </div>
                </div>
              </div>

              {/* Query Parameters */}
              {selectedLog.query && Object.keys(selectedLog.query).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">
                    Query Parameters
                  </h4>
                  <pre className="bg-zinc-950 border border-zinc-800 rounded p-4 text-xs text-zinc-300 overflow-x-auto">
                    {JSON.stringify(selectedLog.query, null, 2)}
                  </pre>
                </div>
              )}

              {/* Headers */}
              {selectedLog.headers && Object.keys(selectedLog.headers).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">Headers</h4>
                  <pre className="bg-zinc-950 border border-zinc-800 rounded p-4 text-xs text-zinc-300 overflow-x-auto">
                    {JSON.stringify(selectedLog.headers, null, 2)}
                  </pre>
                </div>
              )}

              {/* Request Body */}
              {selectedLog.body && Object.keys(selectedLog.body).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">Request Body</h4>
                  <pre className="bg-zinc-950 border border-zinc-800 rounded p-4 text-xs text-zinc-300 overflow-x-auto">
                    {JSON.stringify(selectedLog.body, null, 2)}
                  </pre>
                </div>
              )}

              {/* User Agent */}
              {selectedLog.userAgent && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">User Agent</h4>
                  <p className="text-sm text-zinc-300 bg-zinc-950 border border-zinc-800 rounded p-4 break-all">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
