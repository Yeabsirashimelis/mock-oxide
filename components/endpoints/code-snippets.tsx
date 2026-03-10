"use client";

import { useState } from "react";
import { generateCurl, generateJavaScript, generatePython, generateGo } from "@/lib/code-snippets";
import { CopyButton } from "@/components/ui/copy-button";

interface CodeSnippetsProps {
  projectSlug: string;
  path: string;
  method: string;
  authRequired: boolean;
}

type Language = "curl" | "javascript" | "python" | "go";

export function CodeSnippets({ projectSlug, path, method, authRequired }: CodeSnippetsProps) {
  const [selectedLang, setSelectedLang] = useState<Language>("curl");

  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const url = `${baseUrl}/api/mock/${projectSlug}${path}`;
  const apiKey = "your_api_key_here";

  const snippets: Record<Language, string> = {
    curl: generateCurl({ url, method, hasAuth: authRequired, apiKey }),
    javascript: generateJavaScript({ url, method, hasAuth: authRequired, apiKey }),
    python: generatePython({ url, method, hasAuth: authRequired, apiKey }),
    go: generateGo({ url, method, hasAuth: authRequired, apiKey }),
  };

  const languages: { key: Language; label: string }[] = [
    { key: "curl", label: "cURL" },
    { key: "javascript", label: "JavaScript" },
    { key: "python", label: "Python" },
    { key: "go", label: "Go" },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          {languages.map((lang) => (
            <button
              key={lang.key}
              type="button"
              onClick={() => setSelectedLang(lang.key)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                selectedLang === lang.key
                  ? "bg-blue-600 text-white"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
        <CopyButton text={snippets[selectedLang]} />
      </div>

      <div className="p-4">
        <pre className="text-sm text-zinc-300 font-mono overflow-x-auto">
          <code>{snippets[selectedLang]}</code>
        </pre>
      </div>
    </div>
  );
}
