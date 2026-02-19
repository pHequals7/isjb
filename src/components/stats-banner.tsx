"use client";

import { CountUp } from "@/components/ui/count-up";

interface StatsBannerProps {
  totalVCs: number;
  totalCompanies: number;
  totalJobs: number;
  freshJobs: number;
}

export function StatsBanner({
  totalVCs,
  totalCompanies,
  totalJobs,
  freshJobs,
}: StatsBannerProps) {
  const stats = [
    { label: "VC Funds", value: totalVCs, delayMs: 0 },
    { label: "Companies Hiring", value: totalCompanies, delayMs: 120 },
    { label: "Fresh Openings", value: freshJobs, delayMs: 240 },
    { label: "Total Openings", value: totalJobs, delayMs: 360 },
  ];

  return (
    <div className="border-b bg-card">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:grid-cols-4 sm:gap-0 sm:px-6 sm:py-8 lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="font-mono text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              <CountUp value={stat.value} delayMs={stat.delayMs} durationMs={1500} />
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
