"use client";

import { useEffect, useState } from "react";

interface VCNavItem {
  id: string;
  name: string;
  logoPath: string;
  logoDark?: boolean;

}

interface VCNavBarProps {
  funds: VCNavItem[];
}

export function VCNavBar({ funds }: VCNavBarProps) {
  const [activeId, setActiveId] = useState<string>(funds[0]?.id ?? "");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    for (const fund of funds) {
      const el = document.getElementById(`fund-${fund.id}`);
      if (!el) continue;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveId(fund.id);
          }
        },
        { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, [funds]);

  function scrollTo(id: string) {
    const el = document.getElementById(`fund-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <nav
      className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md"
      aria-label="VC fund navigation"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-0.5 overflow-x-auto px-4 py-2 sm:gap-1 sm:px-6 md:flex-wrap md:justify-center md:overflow-visible lg:px-8">
        {funds.map((fund) => (
          <button
            key={fund.id}
            onClick={() => scrollTo(fund.id)}
            aria-label={`Scroll to ${fund.name}`}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
              activeId === fund.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fund.logoPath}
              alt=""
              className={`h-4 w-auto max-w-[72px] object-contain md:max-w-[88px] ${
                activeId === fund.id
                  ? "brightness-0 invert"
                  : fund.logoDark
                  ? "brightness-0"
                  : ""
              }`}
            />
            <span className="hidden xl:inline">{fund.name}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
