"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Company } from "@/lib/types";

interface CompanyCardProps {
  company: Company;
}

function getLogoSrc(company: Company): string | null {
  if (company.logoUrl) return company.logoUrl;
  if (company.domain) {
    return `https://www.google.com/s2/favicons?domain=${company.domain}&sz=128`;
  }
  return null;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const logoSrc = getLogoSrc(company);
  const [imgError, setImgError] = useState(false);

  const showLetter = !logoSrc || imgError;

  return (
    <a
      href={company.jobsBoardUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card p-5 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/60">
        {showLetter ? (
          <span className="text-lg font-semibold text-muted-foreground/70">
            {company.name.charAt(0).toUpperCase()}
          </span>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={logoSrc!}
            alt={`${company.name} logo`}
            className="h-full w-full object-contain p-1.5"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className="min-w-0 w-full">
        <div className="flex items-center justify-center gap-1">
          <span className="truncate text-sm font-medium leading-tight">
            {company.name}
          </span>
          <ArrowUpRight className="h-3 w-3 shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover:text-foreground/60 group-hover:-translate-y-px group-hover:translate-x-px" />
        </div>
        {company.activeJobCount != null && company.activeJobCount > 0 && (
          <span className="mt-1 block text-xs text-muted-foreground">
            {company.activeJobCount} open{" "}
            {company.activeJobCount === 1 ? "role" : "roles"}
          </span>
        )}
      </div>
    </a>
  );
}
