import { JobBoard } from "@/components/job-board";
import { loadVCFunds } from "@/lib/data";
import { computeUniqueTopStats } from "@/lib/stats";

export default function Home() {
  const funds = loadVCFunds();
  const topStats = computeUniqueTopStats(funds.flatMap((fund) => fund.companies));
  const totalCompanies = topStats.totalCompanies;
  const totalJobs = topStats.totalJobs;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "Indian Startup Jobs Board",
        url: "https://isjb.pages.dev",
        description: `Browse ${totalJobs.toLocaleString()} job openings across ${totalCompanies} VC-backed startups in India. Companies from PeakXV, Accel, Lightspeed, Nexus VP, General Catalyst, and Blume Ventures.`,
      },
      {
        "@type": "ItemList",
        name: "VC Fund Portfolio Companies",
        numberOfItems: totalCompanies,
        itemListElement: funds.map((fund, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: fund.name,
          description: `${fund.totalCompanies} companies with ${fund.totalJobs.toLocaleString()} open positions`,
          url: fund.jobsBoardBaseUrl,
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JobBoard funds={funds} />
    </>
  );
}
