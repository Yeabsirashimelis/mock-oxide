import Link from "next/link";
import { CopyButton } from "@/components/ui/copy-button";

interface DocsHeaderProps {
  project: {
    name: string;
    slug: string;
    description: string | null;
  };
  apiBaseUrl: string;
}

export function DocsHeader({ project, apiBaseUrl }: DocsHeaderProps) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-900/50 sticky top-0 z-10 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-mono text-blue-400">{"{ }"}</span>
              <span className="font-bold text-zinc-100">Mock API</span>
            </Link>
            <span className="text-zinc-600">/</span>
            <h1 className="text-lg font-semibold text-zinc-100">{project.name}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg">
              <code className="text-xs font-mono text-zinc-400">
                {apiBaseUrl}
              </code>
              <CopyButton text={apiBaseUrl} />
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Create Your API
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
