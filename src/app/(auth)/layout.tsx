"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      radius: number;
      speed: number;
      opacity: number;
    }> = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const count = Math.floor((canvas.width * canvas.height) / 12000);
      for (let i = 0; i < Math.min(count, 120); i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height + canvas.height,
          radius: Math.random() * 1.5 + 0.5,
          speed: Math.random() * 0.5 + 0.15,
          opacity: Math.random() * 0.6 + 0.15,
        });
      }
    };

    const initParticlesFull = () => {
      particles = [];
      const count = Math.floor((canvas.width * canvas.height) / 12000);
      for (let i = 0; i < Math.min(count, 120); i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.5,
          speed: Math.random() * 0.5 + 0.15,
          opacity: Math.random() * 0.6 + 0.15,
        });
      }
    };

    window.addEventListener("resize", resizeCanvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticlesFull();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();

        p.y -= p.speed;

        if (p.y < 0) {
          p.y = canvas.height;
          p.x = Math.random() * canvas.width;
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,_#01265c_0%,_#000f2e_60%,_#00061a_100%)] p-4 md:p-8">
      {/* Particle Background */}
      <ParticleBackground />
      
      {/* Content Wrapper */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
