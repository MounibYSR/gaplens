"use client";

import { useEffect, useRef } from "react";

type AmbientParticle = {
  x: number;
  y: number;
  z: number;
  driftX: number;
  driftY: number;
  driftZ: number;
  phase: number;
  freq: number;
  isAmber: boolean;
};

export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D | null = null;
    let w = 0;
    let h = 0;
    let particles: AmbientParticle[] = [];
    let autoAngle = 0;
    let rotY = 0;
    let rotX = 0.1;
    let raf = 0;

    function resize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // Size off the CSS layout viewport rather than window.innerWidth,
      // which can diverge from it in some environments and cause the canvas
      // to overshoot the visible viewport, forcing unwanted page-level
      // horizontal scroll. Set explicit pixel CSS dimensions too, rather
      // than relying on width:100%/height:100% percentage resolution
      // (which for a position:fixed element can itself diverge from the
      // layout viewport in some browsers/embeds) — pixel values always
      // match clientWidth/clientHeight exactly.
      w = document.documentElement.clientWidth;
      h = Math.max(document.documentElement.clientHeight, document.body.scrollHeight, 900);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx = canvas.getContext("2d");
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(90, Math.floor((w * h) / 10000));
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: (Math.random() - 0.5) * 2.2,
          y: (Math.random() - 0.5) * 2.2,
          z: (Math.random() - 0.5) * 2,
          driftX: (Math.random() - 0.5) * 0.06,
          driftY: (Math.random() - 0.5) * 0.06,
          driftZ: (Math.random() - 0.5) * 0.04,
          phase: Math.random() * Math.PI * 2,
          freq: 0.08 + Math.random() * 0.1,
          isAmber: Math.random() < 0.06,
        });
      }
    }

    function frame(now: number) {
      if (ctx && w) {
        const t = now * 0.001;
        ctx.clearRect(0, 0, w, h);

        autoAngle += 0.0009;
        rotY += (autoAngle - rotY) * 0.02;
        rotX += (0.1 - rotX) * 0.02;
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const focal = 2.4;
        const minDim = Math.min(w, h) * 0.55;

        const drawList = particles.map((p) => {
          p.x += p.driftX * 0.01;
          p.y += p.driftY * 0.01;
          p.z += p.driftZ * 0.01;
          if (p.x > 1.3) p.x = -1.3;
          if (p.x < -1.3) p.x = 1.3;
          if (p.y > 1.3) p.y = -1.3;
          if (p.y < -1.3) p.y = 1.3;
          if (p.z > 1.3) p.z = -1.3;
          if (p.z < -1.3) p.z = 1.3;

          const wob = Math.sin(t * p.freq + p.phase) * 0.03;
          const ox = p.x + wob;
          const oy = p.y - wob;
          const oz = p.z;

          const x1 = ox * cosY + oz * sinY;
          const z1 = -ox * sinY + oz * cosY;
          const y1 = oy * cosX - z1 * sinX;
          const z2 = oy * sinX + z1 * cosX;

          const scale = focal / (focal + z2 * 1.3);
          const px = w / 2 + x1 * scale * minDim;
          const py = h / 2 + y1 * scale * minDim;
          return { px, py, z2, scale, isAmber: p.isAmber };
        });

        const linkDist = Math.min(w, h) * 0.11;
        for (let i = 0; i < drawList.length; i++) {
          const a = drawList[i];
          for (let j = i + 1; j < drawList.length; j++) {
            const b = drawList[j];
            const dx = a.px - b.px;
            const dy = a.py - b.py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < linkDist) {
              const proximityT = 1 - dist / linkDist;
              const depthT = Math.max(0, Math.min(1, ((a.z2 + b.z2) / 2 + 1.3) / 2.6));
              const alpha = proximityT * (0.16 + depthT * 0.32);
              ctx.beginPath();
              ctx.moveTo(a.px, a.py);
              ctx.lineTo(b.px, b.py);
              ctx.strokeStyle = `rgba(21,201,154,${alpha})`;
              ctx.lineWidth = 0.6 + depthT * 0.7;
              ctx.stroke();
            }
          }
        }

        for (const d of drawList) {
          const depthT = Math.max(0, Math.min(1, (d.z2 + 1.3) / 2.6));
          const size = (1.1 + depthT * 2.4) * d.scale * 1.5;
          const alpha = 0.18 + depthT * 0.45;
          const col = d.isAmber ? "232,160,32" : Math.random() < 0.5 ? "29,158,117" : "21,201,154";
          ctx.beginPath();
          ctx.arc(d.px, d.py, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${col},${d.isAmber ? alpha * 0.6 : alpha})`;
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
