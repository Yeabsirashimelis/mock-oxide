interface StatusCodeChartProps {
  statusCodes: Record<number, number>;
}

export function StatusCodeChart({ statusCodes }: StatusCodeChartProps) {
  const entries = Object.entries(statusCodes).sort(([a], [b]) => Number(a) - Number(b));

  if (entries.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h3 className="text-sm font-medium text-zinc-300 mb-4">Status Code Distribution</h3>
        <p className="text-sm text-zinc-500">No requests yet</p>
      </div>
    );
  }

  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const maxCount = Math.max(...entries.map(([, count]) => count));

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return "bg-green-500";
    if (code >= 300 && code < 400) return "bg-blue-500";
    if (code >= 400 && code < 500) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusLabel = (code: number) => {
    if (code >= 200 && code < 300) return "Success";
    if (code >= 300 && code < 400) return "Redirect";
    if (code >= 400 && code < 500) return "Client Error";
    return "Server Error";
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <h3 className="text-sm font-medium text-zinc-300 mb-4">Status Code Distribution</h3>
      <div className="space-y-3">
        {entries.map(([code, count]) => {
          const percentage = ((count / total) * 100).toFixed(1);
          const width = (count / maxCount) * 100;

          return (
            <div key={code} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-100">{code}</span>
                  <span className="text-zinc-500">{getStatusLabel(Number(code))}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400">{count.toLocaleString()} requests</span>
                  <span className="text-zinc-500 w-12 text-right">{percentage}%</span>
                </div>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getStatusColor(Number(code))} transition-all duration-500`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
