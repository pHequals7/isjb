"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AnimatedShinyTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export function AnimatedShinyText({
  children,
  className,
  ...props
}: AnimatedShinyTextProps) {
  return (
    <span
      className={cn(
        "inline-block bg-[length:220%_100%] bg-clip-text text-transparent [background-image:linear-gradient(110deg,rgba(255,255,255,0.42),rgba(255,255,255,0.98),rgba(255,255,255,0.42))] animate-[shiny-sweep_3.2s_linear_infinite]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
