"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface CountUpProps {
  value: number;
  durationMs?: number;
  delayMs?: number;
  format?: "number" | "compact";
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function CountUp({
  value,
  durationMs = 1400,
  delayMs = 0,
  format = "number",
}: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const latestValueRef = useRef(0);

  useEffect(() => {
    const target = Math.max(0, Math.round(value));
    const from = latestValueRef.current;

    if (target === from) {
      return;
    }

    let startedAt: number | null = null;
    const timer = window.setTimeout(() => {
      const tick = (timestamp: number) => {
        if (startedAt == null) {
          startedAt = timestamp;
        }

        const elapsed = timestamp - startedAt;
        const progress = Math.min(1, elapsed / durationMs);
        const eased = easeOutCubic(progress);
        const nextValue = Math.round(from + (target - from) * eased);

        setDisplayValue(nextValue);

        if (progress < 1) {
          animationFrameRef.current = window.requestAnimationFrame(tick);
        } else {
          latestValueRef.current = target;
          animationFrameRef.current = null;
        }
      };

      animationFrameRef.current = window.requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
      if (animationFrameRef.current != null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [value, durationMs, delayMs]);

  const formatter = useMemo(() => {
    if (format === "compact") {
      return new Intl.NumberFormat("en", { notation: "compact" });
    }
    return new Intl.NumberFormat("en-IN");
  }, [format]);

  return <span>{formatter.format(displayValue)}</span>;
}
