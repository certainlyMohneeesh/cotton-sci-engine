import type { Metadata } from "next"
import Link from "next/link"
import { CottonSciCalculator } from "@/components/cotton/cotton-sci-calculator"

export const metadata: Metadata = {
  title: "Cotton Quality SCI Engine · Nova Platform",
  description:
    "End-to-end cotton quality intelligence: 5-factor SCI simulation model and AI-powered disease-to-EIL pipeline.",
}

// ─── Static pipeline card data ────────────────────────────────────────────────

const PIPELINE_STAGES = [
  {
    num: "01",
    color: "#6FB0F0",
    bg: "rgba(24,95,165,0.15)",
    title: "AI Detection",
    desc: "Upload a cotton leaf — multimodal vision AI classifies Healthy, Bacterial Blight, Fusarium Wilt, or CLCuV with confidence scoring.",
  },
  {
    num: "02",
    color: "#8FCE5A",
    bg: "rgba(45,80,22,0.15)",
    title: "SCI Model",
    desc: "India-calibrated formula. Six fibre-property sliders plus gin, heat, rain, and variety degradation factors.",
  },
  {
    num: "03",
    color: "#E0AA60",
    bg: "rgba(133,79,11,0.15)",
    title: "Market Pricing",
    desc: "Pull live AGMARKNET mandi benchmarks. Computes the ₹/SCI-point quality penalty automatically.",
  },
  {
    num: "04",
    color: "#F08080",
    bg: "rgba(163,45,45,0.15)",
    title: "EIL Decision",
    desc: "Bipartite loss function (L_yield + L_quality). Verdict: Intervention Justified vs Monitor Only.",
  },
]

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_10%,rgba(24,95,165,0.28),transparent_38%),radial-gradient(circle_at_88%_8%,rgba(153,53,86,0.24),transparent_42%),linear-gradient(180deg,#05070d_0%,#0b1020_62%,#0f1528_100%)]">
      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:38px_38px]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 pt-6 md:px-8 md:pt-8">

        {/* ── Site header ──────────────────────────────────────────────────── */}
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Nova Platform
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Cotton Intelligence Suite
            </h1>
          </div>
          <div className="hidden gap-2 sm:flex">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/50 px-3 py-1 font-mono text-[10px] font-semibold text-muted-foreground backdrop-blur">
              <span className="size-1.5 rounded-full bg-[#8FCE5A]" />
              SCI Engine v2
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/50 px-3 py-1 font-mono text-[10px] font-semibold text-muted-foreground backdrop-blur">
              <span className="size-1.5 animate-pulse rounded-full bg-[#6FB0F0]" />
              AI Vision Active
            </span>
          </div>
        </header>

        {/* ── Intelligence Pipeline entry ───────────────────────────────────── */}
        <section className="mb-6">
          <div className="rounded-xl border border-border/60 bg-card/65 shadow-[0_8px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between gap-4 border-b border-border/50 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded border font-mono text-xs font-bold"
                  style={{ borderColor: "rgba(111,176,240,0.4)", background: "rgba(24,95,165,0.15)", color: "#6FB0F0" }}
                >
                  AI
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Cotton Intelligence Pipeline
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    Disease Detection → SCI Degradation → Market → EIL Decision
                  </p>
                </div>
              </div>
              <Link
                href="/pipeline"
                className="flex-shrink-0 rounded border border-foreground/80 bg-foreground px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-background transition-all hover:opacity-90 active:scale-[0.98]"
              >
                Launch Pipeline →
              </Link>
            </div>

            {/* 4 stage cards */}
            <div className="grid grid-cols-2 gap-px bg-border/30 lg:grid-cols-4">
              {PIPELINE_STAGES.map((s) => (
                <div
                  key={s.num}
                  className="flex flex-col gap-2 bg-card/40 px-4 py-4 transition-colors hover:bg-card/60"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-6 w-7 items-center justify-center rounded text-[10px] font-bold font-mono"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {s.num}
                    </span>
                    <span className="text-xs font-bold text-foreground">{s.title}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SCI Simulation Model ──────────────────────────────────────────── */}
        <section className="pb-8">
          <div className="mb-4 flex items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              SCI Simulation Model
            </p>
            <span className="flex-1 h-px bg-border/40" />
            <span className="font-mono text-[10px] text-muted-foreground">5-factor interactive model</span>
          </div>
          <CottonSciCalculator />
        </section>

      </div>
    </div>
  )
}
