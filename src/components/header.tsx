"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { AnimatedShinyText } from "@/components/magic/animated-shiny-text";
import { Particles } from "@/components/magic/particles";
import { LogoTicker } from "@/components/logo-ticker";
import { vcFundsConfig } from "@/config/vc-funds";

export function Header() {
  const { resolvedTheme } = useTheme();
  const [particleColor, setParticleColor] = useState("#ffffff");

  useEffect(() => {
    setParticleColor(resolvedTheme === "dark" ? "#111111" : "#ffffff");
  }, [resolvedTheme]);

  const logos = vcFundsConfig.map((f) => ({
    name: f.name,
    logoPath: f.logoPath,
  }));

  return (
    <header className="relative overflow-hidden bg-primary text-primary-foreground">
      <Particles
        className="absolute inset-0 z-0 opacity-40"
        quantity={110}
        ease={80}
        color={particleColor}
        refresh
      />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8">
        <div className="inline-flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/isjb.svg"
            alt="ISJB logo"
            className="h-16 w-auto sm:h-20"
          />
          <h1 className="text-left text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            <AnimatedShinyText className="bg-[length:240%_100%] [background-image:linear-gradient(110deg,rgba(255,255,255,0.45),rgba(255,255,255,1),rgba(255,255,255,0.45))] [animation-duration:12.8s]">
              Indian Startup Jobs Board
            </AnimatedShinyText>
          </h1>
        </div>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/60 sm:text-lg">
          Startups raise funding from India&apos;s top VCs to hire talented folks like
          you.
          <br className="hidden sm:inline" />
          Make their lives easier.
        </p>
      </div>
      <LogoTicker logos={logos} />
    </header>
  );
}
