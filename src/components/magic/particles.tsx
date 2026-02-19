"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

interface ParticlesProps {
  className?: string;
  quantity?: number;
  ease?: number;
  color?: string;
  refresh?: boolean;
}

export function Particles({
  className,
  quantity = 100,
  ease = 80,
  color = "#ffffff",
  refresh = false,
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const createParticle = (width: number, height: number): Particle => {
      const speedFactor = Math.max(20, ease) * 0.0006;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * speedFactor,
        vy: (Math.random() - 0.5) * speedFactor,
        size: 0.8 + Math.random() * 1.9,
      };
    };

    const setCanvasSize = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || window.innerWidth;
      const height = parent?.clientHeight || 500;
      canvas.width = width;
      canvas.height = height;
    };

    const resetParticles = () => {
      const width = canvas.width;
      const height = canvas.height;
      particlesRef.current = Array.from({ length: quantity }, () =>
        createParticle(width, height)
      );
    };

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      context.clearRect(0, 0, width, height);
      context.fillStyle = color;

      for (const particle of particlesRef.current) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x <= 0 || particle.x >= width) particle.vx *= -1;
        if (particle.y <= 0 || particle.y >= height) particle.vy *= -1;

        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      }

      animationFrameRef.current = window.requestAnimationFrame(draw);
    };

    setCanvasSize();
    resetParticles();
    draw();

    const handleResize = () => {
      setCanvasSize();
      if (refresh) {
        resetParticles();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current != null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [quantity, ease, color, refresh]);

  return <canvas ref={canvasRef} className={cn("pointer-events-none", className)} />;
}
