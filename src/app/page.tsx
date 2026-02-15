import { JobBoard } from "@/components/job-board";
import { loadVCFunds } from "@/lib/data";

export default function Home() {
  const funds = loadVCFunds();
  const totalCompanies = funds.reduce((s, f) => s + f.totalCompanies, 0);
  const totalJobs = funds.reduce((s, f) => s + f.totalJobs, 0);
  const freshJobs = funds.reduce((s, f) => s + f.freshJobs, 0);

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
