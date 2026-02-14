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
}
