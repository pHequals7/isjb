export interface Company {
  name: string;
  slug: string;
  jobsBoardUrl: string;
  description?: string;
  activeJobCount?: number;
  domain?: string;
  logoUrl?: string;
  sectors?: string[];
  isPubliclyListed?: boolean;
  isStale?: boolean;
  latestJobDate?: string; // YYYY-MM-DD
  /** Whether this company has internship-level roles. Getro-only (uses seniority filter); always false for Consider-based funds. */
  hasInternships?: boolean;
  /** Count of internship-level roles. Getro-only; 0 for Consider-based funds. */
  internshipCount?: number;
}

export interface VCDataFileMeta {
  lastUpdated: string;
  totalCompanies: number;
  source: string;
}

export interface VCDataFile {
  meta: VCDataFileMeta;
  companies: Company[];
}

export interface VCFundConfig {
  id: string;
  name: string;
  logoPath: string;
  jobsBoardBaseUrl: string;
  platform: "consider" | "getro";
  color: string;
  logoDark?: boolean;
}

export interface VCFund extends VCFundConfig {
  companies: Company[];
  totalCompanies: number;
  totalJobs: number;
  freshJobs: number;
}
