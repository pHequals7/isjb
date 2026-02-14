interface StatsBannerProps {
  totalVCs: number;
  totalCompanies: number;
  totalJobs: number;
}

export function StatsBanner({
  totalVCs,
  totalCompanies,
  totalJobs,
}: StatsBannerProps) {
  const stats = [
    { label: "VC Funds", value: totalVCs },
    { label: "Companies Hiring", value: totalCompanies },
    { label: "Open Positions", value: totalJobs.toLocaleString() },
  ];

  return (
    <div className="border-b bg-card">
      <div className="mx-auto grid max-w-7xl grid-cols-3 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="font-mono text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              {stat.value}
            </div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:text-sm">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
