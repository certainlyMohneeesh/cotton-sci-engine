"use client"

import { useState } from "react"
import { type PipelineStage, type PipelineState, DEFAULT_PIPELINE_STATE } from "./pipeline-types"
import { StageDetection } from "./stage-detection"
import { StageSCI } from "./stage-sci"
import { StageMarket } from "./stage-market"
import { StageEIL } from "./stage-eil"

// ─── Step indicator colours (header pills) ────────────────────────────────────
const STEP_COLORS: Record<number, string> = {
  1: "#6FB0F0",
  2: "#8FCE5A",
  3: "#E0AA60",
  4: "#F08080",
}

const STEP_LABELS = [
  { n: 1, label: "01 · AI Detection" },
  { n: 2, label: "02 · SCI Model" },
  { n: 3, label: "03 · Market" },
  { n: 4, label: "04 · EIL Decision" },
]

// ─── Shell ────────────────────────────────────────────────────────────────────

export function CottonPipelineShell() {
  const [stage, setStage] = useState<PipelineStage>(1)
  const [pipeState, setPipeState] = useState<PipelineState>(DEFAULT_PIPELINE_STATE)

  function updateState(updates: Partial<PipelineState>) {
    setPipeState((prev) => ({ ...prev, ...updates }))
  }

  function goStage(n: PipelineStage) {
    if (n > 1 && !pipeState.disease) return
    setStage(n)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function reset() {
    setPipeState(DEFAULT_PIPELINE_STATE)
    setStage(1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const progress = (stage / 4) * 100

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 py-3.5 border-b border-border/60"
        style={{ background: "var(--foreground)", color: "var(--background)" }}>
        <div>
          <div className="font-serif text-lg leading-none">
            Cotton <em className="not-italic" style={{ color: "#C4982A" }}>Intelligence</em> Pipeline
          </div>
          <div className="font-mono text-[10px] opacity-45 mt-0.5 tracking-[0.08em] uppercase">
            Image Detection → SCI Degradation → EIL Decision
          </div>
        </div>

        {/* Step pills */}
        <div className="hidden sm:flex gap-0 font-mono text-[10px]">
          {STEP_LABELS.map(({ n, label }) => {
            const color = STEP_COLORS[n]!
            const active = stage >= n
            return (
              <button
                key={n}
                onClick={() => goStage(n as PipelineStage)}
                className="px-3 py-1.5 font-semibold tracking-[0.06em] transition-opacity border -ml-px first:ml-0"
                style={{
                  color: active ? color : "rgba(255,255,255,0.3)",
                  borderColor: active ? color : "rgba(255,255,255,0.12)",
                  opacity: active ? 1 : 0.45,
                  borderRadius: n === 1 ? "2px 0 0 2px" : n === 4 ? "0 2px 2px 0" : 0,
                  cursor: n === 1 || pipeState.disease ? "pointer" : "default",
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </header>

      {/* ── Progress bar ───────────────────────────────────────────────────── */}
      <div className="h-[3px] w-full" style={{ background: "var(--border)" }}>
        <div className="h-full transition-all duration-500 ease-out" style={{ width: `${progress}%`, background: "var(--foreground)" }} />
      </div>

      {/* ── Stage content ──────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-[1200px] px-4 md:px-8 py-6">
        {stage === 1 && (
          <StageDetection
            state={pipeState}
            onStateChange={updateState}
            onNext={() => goStage(2)}
          />
        )}
        {stage === 2 && (
          <StageSCI
            state={pipeState}
            onStateChange={updateState}
            onNext={() => goStage(3)}
            onBack={() => goStage(1)}
          />
        )}
        {stage === 3 && (
          <StageMarket
            state={pipeState}
            onStateChange={updateState}
            onNext={() => goStage(4)}
            onBack={() => goStage(2)}
          />
        )}
        {stage === 4 && (
          <StageEIL
            state={pipeState}
            onStateChange={updateState}
            onBack={() => goStage(3)}
            onReset={reset}
          />
        )}
      </main>
    </div>
  )
}
