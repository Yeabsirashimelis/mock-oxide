"use client";

import { useState } from "react";
import type { Endpoint } from "@/app/generated/prisma/client";
import { generateMockData, generateMockArray } from "@/lib/mock-generator";
import { generateCurl, generateJavaScript, generatePython, generateGo } from "@/lib/code-snippets";
import { CopyButton } from "@/components/ui/copy-button";

interface DocsEndpointProps {
  endpoint: Endpoint;
  projectSlug: string;
}

export function DocsEndpoint({ endpoint, projectSlug }: DocsEndpointProps) {
  const [activeTab, setActiveTab] = useState<"example" | "schema" | "code">("example");

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const url = `${baseUrl}/api/mock/${projectSlug}${endpoint.path}`;

  // Generate example response
  const exampleData = endpoint.isArray
    ? generateMockArray(endpoint.schema as any, Math.min(endpoint.arrayCount, 3))
    : generateMockData(endpoint.schema as any);

  const exampleJson = JSON.stringify(exampleData, null, 2);

  // Code snippets
  const codeSnippets = {
    curl: generateCurl({ url, method: endpoint.method, hasAuth: endpoint.authRequired, apiKey: "your_api_key_here" }),
    javascript: generateJavaScript({ url, method: endpoint.method, hasAuth: endpoint.authRequired, apiKey: "your_api_key_here" }),
    python: generatePython({ url, method: endpoint.method, hasAuth: endpoint.authRequired, apiKey: "your_api_key_here" }),
    go: generateGo({ url, method: endpoint.method, hasAuth: endpoint.authRequired, apiKey: "your_api_key_here" }),
  };

  const [selectedLang, setSelectedLang] = useState<keyof typeof codeSnippets>("curl");

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "text-green-400 bg-green-500/10 border-green-500/20";
      case "POST":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
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

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden" id={endpoint.id}>
      {/* Endpoint Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <span
              className={`px-2 py-1 text-xs font-medium rounded border ${getMethodColor(
                endpoint.method
              )}`}
            >
              {endpoint.method}
            </span>
            <code className="text-sm font-mono text-zinc-100">{endpoint.path}</code>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            {endpoint.authRequired && (
              <span className="flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
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
                Auth Required
              </span>
            )}
            {endpoint.isArray && (
              <span className="px-2 py-1 bg-zinc-800 rounded">Returns Array</span>
            )}
          </div>
        </div>

        {endpoint.name && (
          <h4 className="text-base font-semibold text-zinc-200 mb-1">{endpoint.name}</h4>
        )}

        {endpoint.description && (
          <p className="text-sm text-zinc-400">{endpoint.description}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800 px-4 bg-zinc-950">
        <button
          onClick={() => setActiveTab("example")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "example"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-zinc-400 hover:text-zinc-100"
          }`}
        >
          Example Response
        </button>
        <button
          onClick={() => setActiveTab("schema")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "schema"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-zinc-400 hover:text-zinc-100"
          }`}
        >
          Schema
        </button>
        <button
          onClick={() => setActiveTab("code")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "code"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-zinc-400 hover:text-zinc-100"
          }`}
        >
          Code Examples
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === "example" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500">
                Status: <span className="text-green-400">{endpoint.responseCode}</span>
              </span>
              <CopyButton text={exampleJson} />
            </div>
            <div className="bg-zinc-950 border border-zinc-700 rounded p-4 overflow-x-auto">
              <pre className="text-sm text-zinc-300 font-mono">{exampleJson}</pre>
            </div>
            {endpoint.isArray && endpoint.arrayCount > 3 && (
              <p className="text-xs text-zinc-500 mt-2">
                Showing 3 of {endpoint.arrayCount} items
              </p>
            )}
          </div>
        )}

        {activeTab === "schema" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500">Response Schema</span>
              <CopyButton text={JSON.stringify(endpoint.schema, null, 2)} />
            </div>
            <div className="bg-zinc-950 border border-zinc-700 rounded p-4 overflow-x-auto">
              <pre className="text-sm text-zinc-300 font-mono">
                {JSON.stringify(endpoint.schema, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {activeTab === "code" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                {(["curl", "javascript", "python", "go"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      selectedLang === lang
                        ? "bg-blue-600 text-white"
                        : "text-zinc-400 hover:text-zinc-100 border border-zinc-700"
                    }`}
                  >
                    {lang === "curl"
                      ? "cURL"
                      : lang === "javascript"
                      ? "JavaScript"
                      : lang === "python"
                      ? "Python"
                      : "Go"}
                  </button>
                ))}
              </div>
              <CopyButton text={codeSnippets[selectedLang]} />
            </div>
            <div className="bg-zinc-950 border border-zinc-700 rounded p-4 overflow-x-auto">
              <pre className="text-sm text-zinc-300 font-mono">
                {codeSnippets[selectedLang]}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
