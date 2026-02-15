import { LogoTicker } from "@/components/logo-ticker";
import { vcFundsConfig } from "@/config/vc-funds";

export function Header() {
  const logos = vcFundsConfig.map((f) => ({
    name: f.name,
    logoPath: f.logoPath,
  }));

  return (
    <header className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 text-center">
        <div className="inline-flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/isjb.svg"
            alt="ISJB logo"
            className="h-16 w-auto sm:h-20"
          />
          <h1 className="text-left text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Indian Startup Jobs Board
          </h1>
        </div>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/60 sm:text-lg">
          Startups raise funding from India&apos;s top VCs to hire talented folks like you.
          <br className="hidden sm:inline" />
          Make their lives easier.
        </p>
      </div>
      <LogoTicker logos={logos} />
    </header>
  );
}
