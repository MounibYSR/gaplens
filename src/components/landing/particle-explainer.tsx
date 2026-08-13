"use client";

import { useEffect, useRef, useState } from "react";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";

type Point3D = { x: number; y: number; z: number };

type Particle = {
  x: number;
  y: number;
  z: number;
  tx: number;
  ty: number;
  tz: number;
  hue: number;
  rot: number;
  rotSpeed: number;
  phase: number;
  freq: number;
  amp: number;
};

type ShapeName = "lens" | "nodes" | "arrow" | "fix";

const N = 260;
const COLORS = ["#1D9E75", "#15c99a", "#E8A020"];

// Hub + 3 branches (120° apart) — one per GapFix resolution path (DIY,
// vetted provider, GapLens executes). Deliberately 3 branches instead of
// the "nodes" step's 5, so the two shapes read as visually distinct.
const FIX_BRANCH_ANGLES_DEG = [-90, 30, 150];
function fixBranchCenters(outerR: number): Point3D[] {
  const centers: Point3D[] = [{ x: 0, y: 0, z: 0 }];
  FIX_BRANCH_ANGLES_DEG.forEach((deg, k) => {
    const ang = (deg * Math.PI) / 180;
    const zz = (k % 2 === 0 ? 1 : -1) * 0.3;
    centers.push({ x: Math.cos(ang) * outerR, y: Math.sin(ang) * outerR, z: zz });
  });
  return centers;
}

const STEP_CONTENT: { shape: ShapeName; title: Record<EntryLang, string>; copy: Record<EntryLang, string> }[] = [
  {
    shape: "lens",
    title: { en: "Diagnose the gap", ar: "شخّص الفجوة" },
    copy: {
      en: "GapLens compares your business against category benchmarks and pinpoints exactly where the gap sits.",
      ar: "GapLens تقارن عملك بمعايير القطاع وتحدد بالضبط وين تقع الفجوة.",
    },
  },
  {
    shape: "nodes",
    title: { en: "Audit your tools", ar: "افحص أدواتك" },
    copy: {
      en: "It maps the systems already in place across your business areas and finds where they disconnect.",
      ar: "يرسم خارطة للأنظمة الموجودة عبر مجالات عملك ويكتشف وين تنقطع عن بعض.",
    },
  },
  {
    shape: "arrow",
    title: { en: "Build the roadmap", ar: "ابنِ خطة العمل" },
    copy: {
      en: "Findings become a prioritized, step-by-step path to close the gap.",
      ar: "النتائج تتحول لخطوات مرتبة بالأولوية لسد الفجوة.",
    },
  },
  {
    shape: "fix",
    title: { en: "GapFix — resolve it your way", ar: "GapFix — عالجها بطريقتك" },
    copy: {
      en: "Every gap comes with a resolution path: do it yourself, get matched with a vetted provider, or let GapLens execute it for you.",
      ar: "كل فجوة تجيك مع مسار حل: تسويها بنفسك، نرشحلك مزود موثوق، أو GapLens تنفذها لك.",
    },
  },
];

function tiltPt(p: Point3D, a: number): Point3D {
  const cy = Math.cos(a);
  const sy = Math.sin(a);
  return { x: p.x, y: p.y * cy - p.z * sy, z: p.y * sy + p.z * cy };
}

function shapePoints3D(name: ShapeName, count: number): Point3D[] {
  let pts: Point3D[] = [];

  if (name === "lens") {
    const R = 0.42;
    const tube = 0.1;
    const rimN = Math.floor(count * 0.82);
    const handleN = count - rimN;

    for (let i = 0; i < rimN; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 2;
      pts.push({
        x: (R + tube * Math.cos(phi)) * Math.cos(theta),
        y: (R + tube * Math.cos(phi)) * Math.sin(theta),
        z: tube * Math.sin(phi),
      });
    }

    const handleAngle = Math.PI / 4;
    const hx1 = Math.cos(handleAngle) * R;
    const hy1 = Math.sin(handleAngle) * R;
    const hx2 = 0.72;
    const hy2 = 0.72;
    for (let j = 0; j < handleN; j++) {
      const t = j / Math.max(handleN - 1, 1);
      pts.push({ x: hx1 + (hx2 - hx1) * t, y: hy1 + (hy2 - hy1) * t, z: 0.02 * Math.sin(t * Math.PI) });
    }

    pts = pts.map((p) => tiltPt(p, 0.4));
  } else if (name === "nodes") {
    const centers: Point3D[] = [{ x: 0, y: 0, z: 0 }];
    const outerR = 0.6;
    for (let k = 0; k < 5; k++) {
      const ang = -Math.PI / 2 + k * ((Math.PI * 2) / 5);
      const zz = (k % 2 === 0 ? 1 : -1) * 0.35;
      centers.push({ x: Math.cos(ang) * outerR, y: Math.sin(ang) * outerR, z: zz });
    }

    const perLine = Math.floor((count * 0.5) / 5);
    for (let c = 1; c < centers.length; c++) {
      for (let l = 0; l < perLine; l++) {
        const t2 = l / perLine;
        pts.push({
          x: centers[0].x + (centers[c].x - centers[0].x) * t2,
          y: centers[0].y + (centers[c].y - centers[0].y) * t2,
          z: centers[0].z + (centers[c].z - centers[0].z) * t2,
        });
      }
    }

    const remaining = count - pts.length;
    const perNode = Math.floor(remaining / centers.length);
    centers.forEach((ctr, idx) => {
      const rr = idx === 0 ? 0.12 : 0.1;
      for (let m = 0; m < perNode; m++) {
        const phi2 = Math.acos(1 - (2 * (m + 0.5)) / perNode);
        const theta2 = Math.PI * (1 + Math.sqrt(5)) * m;
        pts.push({
          x: ctr.x + Math.sin(phi2) * Math.cos(theta2) * rr,
          y: ctr.y + Math.sin(phi2) * Math.sin(theta2) * rr,
          z: ctr.z + Math.cos(phi2) * rr,
        });
      }
    });
  } else if (name === "arrow") {
    const shaftN = Math.floor(count * 0.66);
    const sx1 = -0.6;
    const sy1 = 0.6;
    const sz1 = -0.4;
    const sx2 = 0.42;
    const sy2 = -0.42;
    const sz2 = 0.4;
    for (let s = 0; s < shaftN; s++) {
      const t3 = s / (shaftN - 1);
      const bow = Math.sin(t3 * Math.PI) * 0.12;
      pts.push({
        x: sx1 + (sx2 - sx1) * t3 + bow * 0.3,
        y: sy1 + (sy2 - sy1) * t3 - bow * 0.3,
        z: sz1 + (sz2 - sz1) * t3,
      });
    }

    const headN = count - shaftN;
    const tipX = 0.62;
    const tipY = -0.62;
    const tipZ = 0.46;
    const wingA = { x: 0.62 - 0.32, y: -0.62 + 0.04, z: 0.3 };
    const wingB = { x: 0.62 - 0.04, y: -0.62 + 0.32, z: 0.3 };
    for (let hI = 0; hI < headN; hI++) {
      const frac = hI / headN;
      if (frac < 0.5) {
        const tt = frac / 0.5;
        pts.push({ x: wingA.x + (tipX - wingA.x) * tt, y: wingA.y + (tipY - wingA.y) * tt, z: wingA.z + (tipZ - wingA.z) * tt });
      } else {
        const tt2 = (frac - 0.5) / 0.5;
        pts.push({ x: tipX + (wingB.x - tipX) * tt2, y: tipY + (wingB.y - tipY) * tt2, z: tipZ + (wingB.z - tipZ) * tt2 });
      }
    }
  } else {
    const centers = fixBranchCenters(0.62);

    const perLine = Math.floor((count * 0.55) / 3);
    for (let c = 1; c < centers.length; c++) {
      for (let l = 0; l < perLine; l++) {
        const t2 = l / perLine;
        pts.push({
          x: centers[0].x + (centers[c].x - centers[0].x) * t2,
          y: centers[0].y + (centers[c].y - centers[0].y) * t2,
          z: centers[0].z + (centers[c].z - centers[0].z) * t2,
        });
      }
    }

    const remaining = count - pts.length;
    const perNode = Math.floor(remaining / centers.length);
    centers.forEach((ctr, idx) => {
      const rr = idx === 0 ? 0.14 : 0.12;
      for (let m = 0; m < perNode; m++) {
        const phi2 = Math.acos(1 - (2 * (m + 0.5)) / perNode);
        const theta2 = Math.PI * (1 + Math.sqrt(5)) * m;
        pts.push({
          x: ctr.x + Math.sin(phi2) * Math.cos(theta2) * rr,
          y: ctr.y + Math.sin(phi2) * Math.sin(theta2) * rr,
          z: ctr.z + Math.cos(phi2) * rr,
        });
      }
    });
  }

  while (pts.length < count) pts.push(pts[pts.length % Math.max(pts.length, 1)] ?? { x: 0, y: 0, z: 0 });
  return pts.slice(0, count);
}

function shapeGuideLines(name: ShapeName): Point3D[][] {
  if (name === "lens") {
    const ring: Point3D[] = [];
    const R = 0.42;
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      ring.push({ x: Math.cos(a) * R, y: Math.sin(a) * R, z: 0 });
    }
    const handleAngle = Math.PI / 4;
    const hx1 = Math.cos(handleAngle) * R;
    const hy1 = Math.sin(handleAngle) * R;
    const handle: Point3D[] = [
      { x: hx1, y: hy1, z: 0 },
      { x: 0.72, y: 0.72, z: 0.02 },
    ];
    return [ring.map((p) => tiltPt(p, 0.4)), handle.map((p) => tiltPt(p, 0.4))];
  }
  if (name === "nodes") {
    const centers: Point3D[] = [{ x: 0, y: 0, z: 0 }];
    const outerR = 0.6;
    for (let k = 0; k < 5; k++) {
      const ang = -Math.PI / 2 + k * ((Math.PI * 2) / 5);
      const zz = (k % 2 === 0 ? 1 : -1) * 0.35;
      centers.push({ x: Math.cos(ang) * outerR, y: Math.sin(ang) * outerR, z: zz });
    }
    const lines: Point3D[][] = [];
    for (let c = 1; c < centers.length; c++) lines.push([centers[0], centers[c]]);
    for (let c2 = 1; c2 < centers.length; c2++) {
      const next = c2 === centers.length - 1 ? 1 : c2 + 1;
      lines.push([centers[c2], centers[next]]);
    }
    return lines;
  }
  if (name === "arrow") {
    const sx1 = -0.6;
    const sy1 = 0.6;
    const sz1 = -0.4;
    const sx2 = 0.42;
    const sy2 = -0.42;
    const sz2 = 0.4;
    const shaft: Point3D[] = [];
    for (let s = 0; s <= 20; s++) {
      const t3 = s / 20;
      const bow = Math.sin(t3 * Math.PI) * 0.12;
      shaft.push({ x: sx1 + (sx2 - sx1) * t3 + bow * 0.3, y: sy1 + (sy2 - sy1) * t3 - bow * 0.3, z: sz1 + (sz2 - sz1) * t3 });
    }
    const tip = { x: 0.62, y: -0.62, z: 0.46 };
    const wingA = { x: 0.62 - 0.32, y: -0.62 + 0.04, z: 0.3 };
    const wingB = { x: 0.62 - 0.04, y: -0.62 + 0.32, z: 0.3 };
    return [shaft, [wingA, tip], [tip, wingB]];
  }
  const fixCenters = fixBranchCenters(0.62);
  return fixCenters.slice(1).map((tip) => [fixCenters[0], tip]);
}

function shapeHubPoints(name: ShapeName): Point3D[] {
  if (name === "lens") return [];
  if (name === "nodes") {
    const pts: Point3D[] = [{ x: 0, y: 0, z: 0 }];
    const outerR = 0.6;
    for (let k = 0; k < 5; k++) {
      const ang = -Math.PI / 2 + k * ((Math.PI * 2) / 5);
      const zz = (k % 2 === 0 ? 1 : -1) * 0.35;
      pts.push({ x: Math.cos(ang) * outerR, y: Math.sin(ang) * outerR, z: zz });
    }
    return pts;
  }
  if (name === "arrow") return [{ x: 0.62, y: -0.62, z: 0.46 }];
  return fixBranchCenters(0.62);
}

export function ParticleExplainer({ lang }: { lang: EntryLang }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    const particles: Particle[] = [];
    for (let i = 0; i < N; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: (Math.random() - 0.5) * 2,
        tx: 0,
        ty: 0,
        tz: 0,
        hue: Math.random(),
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        phase: Math.random() * Math.PI * 2,
        freq: 0.5 + Math.random() * 0.5,
        amp: 0.012 + Math.random() * 0.012,
      });
    }

    let ctx: CanvasRenderingContext2D | null = null;
    let w = 0;
    let h = 0;
    let lastStep = -1;
    let mouseX = 0;
    let mouseY = 0;
    let rotY = 0;
    let rotX = 0.15;
    let autoAngle = 0;
    let raf = 0;

    function assignTargets(stepIdx: number) {
      if (!w) return;
      const shape = STEP_CONTENT[stepIdx].shape;
      const pts = shapePoints3D(shape, N);
      const order = pts.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      particles.forEach((p, idx) => {
        const pt = pts[order[idx]];
        p.tx = pt.x;
        p.ty = pt.y;
        p.tz = pt.z;
      });
    }

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx = canvas.getContext("2d");
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      w = rect.width;
      h = rect.height;
      assignTargets(stepRef.current);
    }

    function onMouseMove(e: MouseEvent) {
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }

    function frame(now: number) {
      if (stepRef.current !== lastStep) {
        lastStep = stepRef.current;
        assignTargets(stepRef.current);
      }

      if (ctx && w) {
        const t = now * 0.001;
        autoAngle += 0.0022;
        const targetRotY = autoAngle + mouseX * 0.4;
        const targetRotX = 0.15 + mouseY * 0.2;
        rotY += (targetRotY - rotY) * 0.025;
        rotX += (targetRotX - rotX) * 0.025;

        ctx.clearRect(0, 0, w, h);
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const focal = 2.4;
        const minDim = Math.min(w, h) * 0.4;

        const project = (ox: number, oy: number, oz: number) => {
          const x1 = ox * cosY + oz * sinY;
          const z1 = -ox * sinY + oz * cosY;
          const y1 = oy * cosX - z1 * sinX;
          const z2 = oy * sinX + z1 * cosX;
          const scale = focal / (focal + z2 * 1.3);
          return { px: w / 2 + x1 * scale * minDim, py: h / 2 + y1 * scale * minDim, z2 };
        };

        const guideLines = shapeGuideLines(STEP_CONTENT[stepRef.current].shape);
        for (const line of guideLines) {
          ctx.beginPath();
          line.forEach((pt, i) => {
            const proj = project(pt.x, pt.y, pt.z);
            if (i === 0) ctx?.moveTo(proj.px, proj.py);
            else ctx?.lineTo(proj.px, proj.py);
          });
          ctx.strokeStyle = "rgba(232,236,245,.38)";
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }

        const hubs = shapeHubPoints(STEP_CONTENT[stepRef.current].shape);
        for (const pt of hubs) {
          const proj = project(pt.x, pt.y, pt.z);
          const s = focal / (focal + proj.z2 * 1.3);
          ctx.beginPath();
          ctx.arc(proj.px, proj.py, 4.5 * s, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(232,160,32,.9)";
          ctx.fill();
        }

        const drawList = particles.map((p) => {
          p.x += (p.tx - p.x) * 0.18;
          p.y += (p.ty - p.y) * 0.18;
          p.z += (p.tz - p.z) * 0.18;

          const wobX = Math.sin(t * p.freq + p.phase) * p.amp;
          const wobY = Math.cos(t * p.freq * 0.9 + p.phase) * p.amp;
          const ox = p.x + wobX;
          const oy = p.y + wobY;
          const oz = p.z;

          const x1 = ox * cosY + oz * sinY;
          const z1 = -ox * sinY + oz * cosY;
          const y1 = oy * cosX - z1 * sinX;
          const z2 = oy * sinX + z1 * cosX;

          const scale = focal / (focal + z2 * 1.3);
          const px = w / 2 + x1 * scale * minDim;
          const py = h / 2 + y1 * scale * minDim;

          p.rot += p.rotSpeed;
          const col = COLORS[Math.floor(p.hue * COLORS.length) % COLORS.length];
          return { px, py, z2, scale, rot: p.rot, col };
        });

        drawList.sort((a, b) => a.z2 - b.z2);
        for (const d of drawList) {
          const depthT = Math.max(0, Math.min(1, (d.z2 + 1.3) / 2.6));
          const size = (2 + depthT * 4.2) * d.scale;
          const alpha = 0.22 + depthT * 0.68;
          ctx.save();
          ctx.translate(d.px, d.py);
          ctx.rotate(d.rot);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = d.col;
          ctx.beginPath();
          ctx.moveTo(0, -size);
          ctx.lineTo(size * 0.87, size * 0.6);
          ctx.lineTo(-size * 0.87, size * 0.6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    stage.addEventListener("mousemove", onMouseMove);

    const autoAdvance = setInterval(() => {
      setStep((s) => (s + 1) % STEP_CONTENT.length);
    }, 5200);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(autoAdvance);
      window.removeEventListener("resize", resize);
      stage.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div>
      <div className="flex flex-wrap-reverse items-center justify-center gap-10">
        <div className="min-w-[280px] max-w-[340px] flex-1">
          {STEP_CONTENT.map((s, i) => {
            const active = i === step;
            return (
              <div
                key={s.shape}
                onClick={() => setStep(i)}
                className="mb-2.5 flex cursor-pointer items-start gap-4 rounded-2xl p-4 transition-colors duration-300"
                style={{
                  background: active ? "rgba(29,158,117,.08)" : "transparent",
                  border: active ? "1px solid rgba(29,158,117,.3)" : "1px solid transparent",
                }}
              >
                <div
                  className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-xs font-extrabold"
                  style={{
                    background: active ? "linear-gradient(135deg,#1D9E75,#E8A020)" : "var(--glass-2)",
                    color: active ? "var(--navy)" : "var(--muted)",
                  }}
                >
                  0{i + 1}
                </div>
                <div className="flex-1">
                  <div
                    className="mb-1 text-sm font-extrabold"
                    style={{ color: active ? "var(--ink)" : "#c3c8d6" }}
                  >
                    {s.title[lang]}
                  </div>
                  <div className="text-xs leading-relaxed text-muted">{s.copy[lang]}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div ref={stageRef} className="relative aspect-square w-[min(440px,88vw)] flex-none">
          <canvas ref={canvasRef} className="block h-full w-full" />
        </div>
      </div>

      <div className="mt-7 flex justify-center gap-2">
        {STEP_CONTENT.map((s, i) => (
          <div
            key={s.shape}
            onClick={() => setStep(i)}
            className="h-2 cursor-pointer rounded-full transition-all duration-300"
            style={{
              width: i === step ? "22px" : "8px",
              background: i === step ? "linear-gradient(90deg,#1D9E75,#E8A020)" : "rgba(255,255,255,.15)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
