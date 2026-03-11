interface AnalyticsStatsProps {
  totalRequests: number;
  recentRequests: number;
  avgDuration: number;
  totalEndpoints: number;
}

export function AnalyticsStats({
  totalRequests,
  recentRequests,
  avgDuration,
  totalEndpoints,
}: AnalyticsStatsProps) {
  const stats = [
    {
      label: "Total Requests",
      value: totalRequests.toLocaleString(),
      subtext: "All time",
    },
    {
      label: "Last 24 Hours",
      value: recentRequests.toLocaleString(),
      subtext: "Recent activity",
    },
    {
      label: "Avg Response Time",
      value: `${avgDuration}ms`,
      subtext: "Average duration",
    },
    {
      label: "Active Endpoints",
      value: totalEndpoints.toString(),
      subtext: "Total endpoints",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
        >
          <div className="text-sm text-zinc-400 mb-1">{stat.label}</div>
          <div className="text-3xl font-bold text-zinc-100 mb-1">
            {stat.value}
          </div>
          <div className="text-xs text-zinc-500">{stat.subtext}</div>
        </div>
      ))}
    </div>
  );
}
