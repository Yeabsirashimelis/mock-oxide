"use client";

import { useState } from "react";
import type { Endpoint } from "@/app/generated/prisma/client";
import { EndpointForm } from "./endpoint-form";
import { EndpointTester } from "./endpoint-tester";
import { EndpointLogs } from "./endpoint-logs";

interface EndpointTabsProps {
  projectSlug: string;
  endpoint: Endpoint;
}

export function EndpointTabs({ projectSlug, endpoint }: EndpointTabsProps) {
  const [activeTab, setActiveTab] = useState<"configure" | "test" | "logs">("configure");

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800 mb-6">
        <button
          onClick={() => setActiveTab("configure")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "configure"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-zinc-400 hover:text-zinc-100"
          }`}
        >
          Configure
        </button>
        <button
          onClick={() => setActiveTab("test")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "test"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-zinc-400 hover:text-zinc-100"
          }`}
        >
          Test
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "logs"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-zinc-400 hover:text-zinc-100"
          }`}
        >
          Logs
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "configure" && (
        <EndpointForm
          mode="edit"
          projectSlug={projectSlug}
          initialData={endpoint}
        />
      )}

      {activeTab === "test" && (
        <div className="max-w-4xl">
          <EndpointTester
            projectSlug={projectSlug}
            endpoint={{
              path: endpoint.path,
              method: endpoint.method,
              authRequired: endpoint.authRequired,
            }}
          />
        </div>
      )}

      {activeTab === "logs" && (
        <EndpointLogs projectSlug={projectSlug} endpointId={endpoint.id} />
      )}
    </div>
  );
}
