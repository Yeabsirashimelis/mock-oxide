"use client";

import { useEffect, useState } from "react";
import type { Endpoint } from "@/app/generated/prisma/client";

interface DocsNavigationProps {
  endpoints: Endpoint[];
}

export function DocsNavigation({ endpoints }: DocsNavigationProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -80% 0px" }
    );

    const endpointElements = endpoints.map((e) => document.getElementById(e.id));
    endpointElements.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [endpoints]);

  const groupedEndpoints = endpoints.reduce((acc, endpoint) => {
    const pathSegments = endpoint.path.split("/").filter(Boolean);
    const category = pathSegments[0] || "root";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(endpoint);
    return acc;
  }, {} as Record<string, Endpoint[]>);

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "text-green-400";
      case "POST":
        return "text-blue-400";
      case "PUT":
        return "text-yellow-400";
      case "PATCH":
        return "text-orange-400";
      case "DELETE":
        return "text-red-400";
      default:
        return "text-zinc-400";
    }
  };

  return (
    <nav className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Endpoints</h3>
        <div className="space-y-4">
          {Object.entries(groupedEndpoints).map(([category, categoryEndpoints]) => (
            <div key={category}>
              <p className="text-xs font-medium text-zinc-500 uppercase mb-2">
                {category === "root" ? "Root" : category}
              </p>
              <div className="space-y-1">
                {categoryEndpoints.map((endpoint) => (
                  <a
                    key={endpoint.id}
                    href={`#${endpoint.id}`}
                    className={`block px-2 py-1.5 rounded text-xs transition-colors ${
                      activeId === endpoint.id
                        ? "bg-zinc-800 text-zinc-100"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${getMethodColor(endpoint.method)}`}>
                        {endpoint.method}
                      </span>
                      <span className="font-mono truncate">{endpoint.path}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
