"use client";

import { useState } from "react";
import { CopyButton } from "@/components/ui/copy-button";

interface EndpointTesterProps {
  projectSlug: string;
  endpoint: {
    path: string;
    method: string;
    authRequired: boolean;
  };
}

export function EndpointTester({ projectSlug, endpoint }: EndpointTesterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<{
    status: number;
    statusText: string;
    data: unknown;
    headers: Record<string, string>;
    duration: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Request configuration
  const [queryParams, setQueryParams] = useState("");
  const [requestBody, setRequestBody] = useState("{}");
  const [requestHeaders, setRequestHeaders] = useState(
    endpoint.authRequired ? "X-API-Key: your_api_key_here" : ""
  );

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const fullUrl = `${baseUrl}/api/mock/${projectSlug}${endpoint.path}${
    queryParams ? `?${queryParams}` : ""
  }`;

  const handleTest = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    const startTime = performance.now();

    try {
      // Parse headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (requestHeaders.trim()) {
        requestHeaders.split("\n").forEach((line) => {
          const [key, ...valueParts] = line.split(":");
          if (key && valueParts.length > 0) {
            headers[key.trim()] = valueParts.join(":").trim();
          }
        });
      }

      // Build request options
      const options: RequestInit = {
        method: endpoint.method,
        headers,
      };

      // Add body for POST, PUT, PATCH
      if (["POST", "PUT", "PATCH"].includes(endpoint.method)) {
        try {
          JSON.parse(requestBody);
          options.body = requestBody;
        } catch (e) {
          setError("Invalid JSON in request body");
          setIsLoading(false);
          return;
        }
      }

      const res = await fetch(fullUrl, options);
      const duration = Math.round(performance.now() - startTime);

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        data,
        headers: responseHeaders,
        duration,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-400";
    if (status >= 300 && status < 400) return "text-blue-400";
    if (status >= 400 && status < 500) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-4">
      {/* Request Configuration */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950">
          <h3 className="text-sm font-medium text-zinc-300">Request</h3>
        </div>

        <div className="p-4 space-y-4">
          {/* URL */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              Request URL
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono text-zinc-100 bg-zinc-950 px-3 py-2 rounded border border-zinc-700">
                {fullUrl}
              </code>
              <CopyButton text={fullUrl} />
            </div>
          </div>

          {/* Query Parameters */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              Query Parameters (e.g., page=1&limit=10)
            </label>
            <input
              type="text"
              value={queryParams}
              onChange={(e) => setQueryParams(e.target.value)}
              placeholder="page=1&limit=10"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-zinc-100 text-sm font-mono placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Headers */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              Headers (one per line: Key: Value)
            </label>
            <textarea
              rows={3}
              value={requestHeaders}
              onChange={(e) => setRequestHeaders(e.target.value)}
              placeholder="X-API-Key: your_key_here"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-zinc-100 text-sm font-mono placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Body (for POST, PUT, PATCH) */}
          {["POST", "PUT", "PATCH"].includes(endpoint.method) && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">
                Request Body (JSON)
              </label>
              <textarea
                rows={6}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-zinc-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleTest}
            disabled={isLoading}
            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {isLoading ? "Sending..." : `Send ${endpoint.method} Request`}
          </button>
        </div>
      </div>

      {/* Response */}
      {(response || error) && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-300">Response</h3>
            {response && (
              <div className="flex items-center gap-4 text-xs">
                <span className={`font-mono font-medium ${getStatusColor(response.status)}`}>
                  {response.status} {response.statusText}
                </span>
                <span className="text-zinc-400">
                  {response.duration}ms
                </span>
              </div>
            )}
          </div>

          <div className="p-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {response && (
              <>
                {/* Response Headers */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-zinc-400">
                      Headers
                    </label>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-700 rounded p-3 max-h-32 overflow-auto">
                    <pre className="text-xs text-zinc-300 font-mono">
                      {Object.entries(response.headers)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join("\n")}
                    </pre>
                  </div>
                </div>

                {/* Response Body */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-zinc-400">
                      Body
                    </label>
                    <CopyButton
                      text={
                        typeof response.data === "string"
                          ? response.data
                          : JSON.stringify(response.data, null, 2)
                      }
                    />
                  </div>
                  <div className="bg-zinc-950 border border-zinc-700 rounded p-3 max-h-96 overflow-auto">
                    <pre className="text-sm text-zinc-300 font-mono">
                      {typeof response.data === "string"
                        ? response.data
                        : JSON.stringify(response.data, null, 2)}
                    </pre>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
