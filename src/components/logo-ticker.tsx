"use client";

interface LogoItem {
  name: string;
  logoPath: string;
}

interface LogoTickerProps {
  logos: LogoItem[];
}

export function LogoTicker({ logos }: LogoTickerProps) {
  // Duplicate logos enough times to fill the viewport and ensure seamless loop
  const repeated = [...logos, ...logos, ...logos, ...logos];

  return (
    <div className="overflow-hidden bg-primary/90 border-t border-primary-foreground/10">
      <div className="flex animate-ticker">
        {repeated.map((logo, i) => (
          <div
            key={`${logo.name}-${i}`}
            className="flex shrink-0 items-center justify-center px-10 py-3 sm:px-14 sm:py-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo.logoPath}
              alt={logo.name}
              className="h-6 w-auto object-contain brightness-0 invert opacity-60 sm:h-8"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
