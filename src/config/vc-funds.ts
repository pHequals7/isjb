import { VCFundConfig } from "@/lib/types";

export const vcFundsConfig: VCFundConfig[] = [
  {
    id: "peakxv",
    name: "PeakXV Partners",
    logoPath: "/logos/vc/peakxv.png",
    jobsBoardBaseUrl: "https://careers.peakxv.com",
    platform: "consider",
    color: "#1a1a2e",
    logoDark: true,
  },
  {
    id: "accel",
    name: "Accel",
    logoPath: "/logos/vc/accel.png",
    jobsBoardBaseUrl: "https://jobs.accel.com",
    platform: "getro",
    color: "#4f46e5",
    logoScale: 2,
  },
  {
    id: "lightspeed",
    name: "Lightspeed",
    logoPath: "/logos/vc/lightspeed.svg",
    jobsBoardBaseUrl: "https://jobs.lsvp.com",
    platform: "consider",
    color: "#dc2626",
  },
  {
    id: "nexus",
    name: "Nexus Venture Partners",
    logoPath: "/logos/vc/nexus.png",
    jobsBoardBaseUrl: "https://jobs.nexusvp.com",
    platform: "consider",
    color: "#0891b2",
  },
  {
    id: "gc",
    name: "General Catalyst",
    logoPath: "/logos/vc/gc.png",
    jobsBoardBaseUrl: "https://jobs.generalcatalyst.com",
    platform: "getro",
    color: "#059669",
  },
];
