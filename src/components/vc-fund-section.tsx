import { CompanyCard } from "./company-card";
import type { VCFund } from "@/lib/types";

interface VCFundSectionProps {
  fund: VCFund;
}

export function VCFundSection({ fund }: VCFundSectionProps) {
  return (
    <section id={`fund-${fund.id}`} className="scroll-mt-16 py-10 sm:py-14">
      <div className="mb-8 flex items-end justify-between">
        <div className="flex items-center gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fund.logoPath}
            alt={`${fund.name} logo`}
            className={`h-8 w-auto object-contain sm:h-10${fund.logoDark ? " brightness-0" : ""}`}
            style={{ maxWidth: "160px" }}
          />
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-sm font-medium text-foreground sm:text-base">
              {fund.totalCompanies} companies
            </p>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {fund.totalJobs.toLocaleString()} open positions
            </p>
          </div>
        </div>
        <a
          href={fund.jobsBoardBaseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
        >
          View all &rarr;
        </a>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {fund.companies.map((company) => (
          <CompanyCard key={company.slug} company={company} />
        ))}
      </div>
    </section>
  );
}
