import { CopyButton } from "@/components/ui/copy-button";

interface McpConnectCardProps {
  baseUrl: string;
}

/**
 * Explains how to point an AI agent (Claude Code, or any MCP client) at the
 * platform's MCP server. The command uses a placeholder for the key — the
 * real key is only revealed once, at creation time.
 */
export function McpConnectCard({ baseUrl }: McpConnectCardProps) {
  const mcpUrl = `${baseUrl}/api/mcp`;
  const command = `claude mcp add --transport http mock-oxide ${mcpUrl} --header "Authorization: Bearer <your-api-key>"`;

  return (
    <div
      id="connect-agent"
      className="mb-6 p-6 bg-gradient-to-br from-blue-500/10 to-zinc-900 border border-blue-500/20 rounded-lg"
    >
      <div className="flex items-center gap-2 mb-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-400"
        >
          <path d="M12 8V4H8" />
          <rect width="16" height="12" x="4" y="8" rx="2" />
          <path d="M2 14h2M20 14h2M15 13v2M9 13v2" />
        </svg>
        <h2 className="text-lg font-semibold text-zinc-100">
          Connect your AI agent
        </h2>
      </div>
      <p className="text-sm text-zinc-400 mb-4">
        Let Claude Code (or any MCP client) create projects and endpoints for
        you — prompt it to build the backend your frontend needs, and the mock
        API goes live instantly.
      </p>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-zinc-500 mb-1">MCP server URL</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm font-mono text-zinc-300 truncate">
              {mcpUrl}
            </code>
            <CopyButton text={mcpUrl} />
          </div>
        </div>

        <div>
          <p className="text-xs text-zinc-500 mb-1">
            Add to Claude Code (swap in an API key from below)
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm font-mono text-zinc-300 overflow-x-auto whitespace-nowrap">
              {command}
            </code>
            <CopyButton text={command} />
          </div>
        </div>
      </div>
    </div>
  );
}
