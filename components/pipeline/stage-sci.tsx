"use client"

import { useMemo } from "react"
import { calcSCIIndia, MM_PER_INCH, GRADE_BANDS } from "@/lib/cotton-sci"
import { type PipelineState, PIPELINE_DISEASES } from "./pipeline-types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rlabel(v: number) {
  if (v === 0) return "None"
  if (v < 30) return "Low"
  if (v < 60) return "Moderate"
  if (v < 80) return "High"
  return "Severe"
}

function getGradeIndia(sci: number) {
  for (const g of GRADE_BANDS) if (sci >= g.min) return g
  return GRADE_BANDS[GRADE_BANDS.length - 1]!
}

function fmtSCI(n: number) { return Math.round(n).toString() }

// Dark-mode adapted grade colors (keeping hues but brightened)
const DARK_GRADES: Record<string, { bg: string; clr: string }> = {
  Premium:    { bg: "rgba(45,80,22,0.28)",   clr: "#8FCE5A" },
  Good:       { bg: "rgba(24,95,165,0.28)",  clr: "#6FB0F0" },
  Average:    { bg: "rgba(196,152,42,0.28)", clr: "#E0C060" },
  "Below Avg":{ bg: "rgba(196,122,26,0.28)", clr: "#E0AA60" },
  Poor:       { bg: "rgba(163,45,45,0.28)",  clr: "#F08080" },
}

const SCALE_TIERS = [
  { lbl: "Premium",   clr: "#8FCE5A" },
  { lbl: "Good",      clr: "#6FB0F0" },
  { lbl: "Average",   clr: "#E0C060" },
  { lbl: "Below Avg", clr: "#E0AA60" },
  { lbl: "Poor",      clr: "#F08080" },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface StageSCIProps {
  state: PipelineState
  onStateChange: (updates: Partial<PipelineState>) => void
  onNext: () => void
  onBack: () => void
}

// ─── Slider row ───────────────────────────────────────────────────────────────

function SRow({
  name, desc, min, max, step, value, fmt, onChange,
}: {
  name: string; desc: string; min: number; max: number; step: number
  value: number; fmt: (v: number) => string; onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/40 last:border-b-0">
      <div className="min-w-[150px]">
        <div className="text-xs font-semibold text-foreground">{name}</div>
        <div className="font-mono text-[10px] text-muted-foreground">{desc}</div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-foreground h-0.5" />
      <span className="font-mono text-xs font-medium min-w-[52px] text-right text-foreground">
        {fmt(value)}
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StageSCI({ state, onStateChange, onNext, onBack }: StageSCIProps) {
  const dis = state.disease ? PIPELINE_DISEASES[state.disease] : null
  const sevF = state.severity / 100

  // Disease deltas (absolute percentage changes)
  const dd = dis && state.disease !== "Healthy" ? dis.deltas : { str: 0, mic: 0, len: 0, ui: 0, rd: 0, yb: 0 }

  // Gin deltas
  const ginLen = -state.ginPasses * 0.3
  const ginUI  = -state.ginPasses * 0.7

  // Heat deltas
  const heatF  = state.envHeat / 100
  const heatLen = -heatF * 8
  const heatMic =  heatF * 0.5

  // Rain deltas
  const rainF  = state.envRain / 100
  const rainRd = -rainF * 15
  const rainYb =  rainF * 6

  // Gen deltas
  const genStr = state.genVar * 4
  const genLen = state.genVar * 3
  const genUI  = state.genVar * 2

  // Final adjusted fiber values
  const finalStr = state.fiberStr * (1 + (dd.str * sevF + genStr) / 100)
  const finalMic = state.fiberMic * (1 + (dd.mic * sevF + heatMic) / 100)
  const finalLenIn = state.fiberLenIn * (1 + (dd.len * sevF + ginLen + heatLen + genLen) / 100)
  const finalUI  = state.fiberUI  * (1 + (dd.ui  * sevF + ginUI  + genUI) / 100)
  const finalRd  = state.fiberRd  * (1 + (dd.rd  * sevF + rainRd) / 100)
  const finalYb  = state.fiberYb  * (1 + Math.abs(dd.yb * sevF + rainYb) / 100)

  // SCI India (UHML in mm)
  const sciH = useMemo(() =>
    calcSCIIndia(state.fiberStr, state.fiberMic, state.fiberLenIn * MM_PER_INCH, state.fiberUI, state.fiberRd, state.fiberYb),
    [state.fiberStr, state.fiberMic, state.fiberLenIn, state.fiberUI, state.fiberRd, state.fiberYb]
  )
  const sciF = calcSCIIndia(finalStr, finalMic, finalLenIn * MM_PER_INCH, finalUI, finalRd, finalYb)
  const sciDelta = sciF - sciH

  // Push computed values to parent
  const computed = { sciHealthy: sciH, sciFinal: sciF, sciDelta }

  const grH = getGradeIndia(sciH)
  const grF = getGradeIndia(sciF)
  const dkH = DARK_GRADES[grH.lbl] ?? { bg: "var(--muted)", clr: "var(--foreground)" }
  const dkF = DARK_GRADES[grF.lbl] ?? { bg: "var(--muted)", clr: "var(--foreground)" }

  // Factor contributions (SCI impact of each factor in isolation)
  const factors = [
    { name: "Disease",    val: calcSCIIndia(state.fiberStr*(1+dd.str*sevF/100), state.fiberMic*(1+dd.mic*sevF/100), state.fiberLenIn*(1+dd.len*sevF/100)*MM_PER_INCH, state.fiberUI*(1+dd.ui*sevF/100), state.fiberRd*(1+dd.rd*sevF/100), state.fiberYb*(1+Math.abs(dd.yb*sevF)/100)) - sciH, color: "#F08080" },
    { name: "Ginning",   val: calcSCIIndia(state.fiberStr, state.fiberMic, state.fiberLenIn*(1+ginLen/100)*MM_PER_INCH, state.fiberUI*(1+ginUI/100), state.fiberRd, state.fiberYb) - sciH, color: "#E0AA60" },
    { name: "Heat Stress",val: calcSCIIndia(state.fiberStr, state.fiberMic*(1+heatMic/100), state.fiberLenIn*(1+heatLen/100)*MM_PER_INCH, state.fiberUI, state.fiberRd, state.fiberYb) - sciH, color: "#6FB0F0" },
    { name: "Rain",      val: calcSCIIndia(state.fiberStr, state.fiberMic, state.fiberLenIn*MM_PER_INCH, state.fiberUI, state.fiberRd*(1+rainRd/100), state.fiberYb*(1+Math.abs(rainYb)/100)) - sciH, color: "#6FB0F0" },
    { name: "Genetics",  val: calcSCIIndia(state.fiberStr*(1+genStr/100), state.fiberMic, state.fiberLenIn*(1+genLen/100)*MM_PER_INCH, state.fiberUI*(1+genUI/100), state.fiberRd, state.fiberYb) - sciH, color: "#8FCE5A" },
  ]
  const maxAbs = Math.max(1, ...factors.map((f) => Math.abs(f.val)))

  // Delta table rows
  const deltaRows = [
    { k: "Strength", h: state.fiberStr, f: finalStr },
    { k: "Micronaire", h: state.fiberMic, f: finalMic },
    { k: "UHML (mm)", h: state.fiberLenIn * MM_PER_INCH, f: finalLenIn * MM_PER_INCH },
    { k: "Unif. Index", h: state.fiberUI, f: finalUI },
    { k: "Reflectance Rd", h: state.fiberRd, f: finalRd },
    { k: "Yellowness +b", h: state.fiberYb, f: finalYb },
  ]

  return (
    <div>
      {/* Stage header */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border/60">
        <div className="w-10 h-10 rounded flex items-center justify-center font-mono text-lg font-semibold flex-shrink-0"
          style={{ background: "rgba(45,80,22,0.18)", color: "#8FCE5A" }}>02</div>
        <div>
          <div className="font-serif text-2xl leading-none text-foreground">SCI Degradation Model</div>
          <div className="font-mono text-[11px] text-muted-foreground mt-1 tracking-[0.04em]">
            India-calibrated Spinning Consistency Index · Input agronomic & field factors
          </div>
        </div>
      </div>

      {/* Formula */}
      <div className="rounded px-3 py-2 font-mono text-[11px] leading-[1.7] mb-5 border border-border/40 bg-foreground/5">
        <span className="text-muted-foreground">SCI India</span>
        <span className="text-foreground"> = −415 − 9.31·Mic + 1.98·UHML(mm) + 4.87·UI% + 2.85·Str + 0.64·Rd + 0.30·(+b)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT – sliders */}
        <div className="space-y-4">
          <div className="rounded border border-border/60 bg-card/70 backdrop-blur p-4">
            <div className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
              Disease-Adjusted Fiber Properties <span className="flex-1 h-px bg-border/60" />
            </div>
            {dis && state.disease !== "Healthy" && (
              <div className="rounded px-3 py-2 font-mono text-[10px] leading-relaxed mb-3"
                style={{ background: dis.darkBg, color: dis.color }}>
                {dis.label} detected ({state.severity}% severity) — property values pre-adjusted
              </div>
            )}
            <SRow name="Strength" desc="g/tex" min={18} max={38} step={0.5} value={state.fiberStr} fmt={(v) => v.toFixed(1)} onChange={(v) => onStateChange({ fiberStr: v, ...computed })} />
            <SRow name="Micronaire" desc="fineness + maturity" min={2.5} max={6.5} step={0.1} value={state.fiberMic} fmt={(v) => v.toFixed(1)} onChange={(v) => onStateChange({ fiberMic: v, ...computed })} />
            <SRow name="UHML Length" desc="inches (mm in formula)" min={0.85} max={1.35} step={0.01} value={state.fiberLenIn}
              fmt={(v) => `${v.toFixed(2)}" / ${(v * MM_PER_INCH).toFixed(1)}mm`}
              onChange={(v) => onStateChange({ fiberLenIn: v, ...computed })} />
            <SRow name="Uniformity Index" desc="%" min={74} max={88} step={0.5} value={state.fiberUI} fmt={(v) => `${v.toFixed(1)}%`} onChange={(v) => onStateChange({ fiberUI: v, ...computed })} />
            <SRow name="Reflectance Rd" desc="whiteness" min={60} max={85} step={0.5} value={state.fiberRd} fmt={(v) => v.toFixed(1)} onChange={(v) => onStateChange({ fiberRd: v, ...computed })} />
            <SRow name="Yellowness +b" desc="color tint" min={6} max={16} step={0.5} value={state.fiberYb} fmt={(v) => v.toFixed(1)} onChange={(v) => onStateChange({ fiberYb: v, ...computed })} />
          </div>

          <div className="rounded border border-border/60 bg-card/70 backdrop-blur p-4">
            <div className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
              Additional Degradation Factors <span className="flex-1 h-px bg-border/60" />
            </div>
            <SRow name="Ginning passes" desc="lint cleaning → length/UI loss" min={0} max={3} step={1} value={state.ginPasses} fmt={(v) => v.toString()} onChange={(v) => onStateChange({ ginPasses: Math.round(v), ...computed })} />
            <SRow name="Heat stress" desc="raises mic, shortens fibre" min={0} max={100} step={1} value={state.envHeat} fmt={rlabel} onChange={(v) => onStateChange({ envHeat: v, ...computed })} />
            <SRow name="Rain exposure" desc="Rd drop, +b rise" min={0} max={100} step={1} value={state.envRain} fmt={rlabel} onChange={(v) => onStateChange({ envRain: v, ...computed })} />
            <div className="flex items-center gap-3 py-2">
              <div className="min-w-[150px]">
                <div className="text-xs font-semibold text-foreground">Variety tier</div>
                <div className="font-mono text-[10px] text-muted-foreground">genetic baseline</div>
              </div>
              <select value={state.genVar.toString()} onChange={(e) => onStateChange({ genVar: parseFloat(e.target.value), ...computed })}
                className="flex-1 rounded border border-border/60 bg-card text-foreground text-xs px-2 py-1.5 font-sans outline-none">
                <option value="0">Mid-grade Upland (baseline)</option>
                <option value="1">Premium ELS / Pima</option>
                <option value="-1">Low-grade / short-staple</option>
                <option value="0.5">Improved Bt hybrid</option>
                <option value="-0.5">Old unimproved variety</option>
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT – results */}
        <div className="space-y-4">
          {/* Big SCI card */}
          <div className="rounded-lg p-5 relative overflow-hidden border border-border/60 bg-card/80 backdrop-blur">
            <div className="absolute right-4 top-2 font-serif text-[80px] opacity-[0.04] leading-none pointer-events-none text-foreground">SCI</div>
            <div className="flex gap-5">
              <div className="flex-1">
                <div className="text-[9px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-1">Healthy Baseline SCI</div>
                <div className="font-serif text-5xl tracking-tight leading-none text-foreground">{fmtSCI(sciH)}</div>
                <span className="inline-flex rounded text-[9px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 mt-1.5" style={{ background: dkH.bg, color: dkH.clr }}>{grH.lbl}</span>
              </div>
              <div className="w-px bg-border/60" />
              <div className="flex-1">
                <div className="text-[9px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-1">Disease-Adjusted SCI</div>
                <div className="font-serif text-5xl tracking-tight leading-none" style={{ color: "#F5A623" }}>{fmtSCI(sciF)}</div>
                <span className="inline-flex rounded text-[9px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 mt-1.5" style={{ background: dkF.bg, color: dkF.clr }}>{grF.lbl}</span>
              </div>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/50">
              <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-muted-foreground">ΔSCI Loss</span>
              <span className="font-mono text-xl font-semibold"
                style={{ color: sciDelta < -5 ? "#F5A623" : sciDelta < 0 ? "#E0C060" : "#8FCE5A" }}>
                {sciDelta >= 0 ? "+" : ""}{Math.round(sciDelta)} pts
              </span>
            </div>
          </div>

          {/* Quality grade scale */}
          <div className="rounded border border-border/60 bg-card/70 backdrop-blur p-4">
            <div className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
              Quality Grade Scale <span className="flex-1 h-px bg-border/60" />
            </div>
            <div className="flex gap-1.5">
              {SCALE_TIERS.map((t) => {
                const active = grF.lbl === t.lbl
                return (
                  <div key={t.lbl} className="flex-1 text-center">
                    <div className="h-1.5 rounded-full mb-1" style={{ background: t.clr, opacity: active ? 1 : 0.22, outline: active ? `2px solid ${t.clr}` : undefined, outlineOffset: active ? "2px" : undefined }} />
                    <div className="text-[9px] font-mono uppercase tracking-[0.04em]" style={{ color: active ? t.clr : "var(--muted-foreground)", fontWeight: active ? 700 : 400 }}>{t.lbl}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Factor contributions */}
          <div className="rounded border border-border/60 bg-card/70 backdrop-blur p-4">
            <div className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
              SCI Impact by Factor <span className="flex-1 h-px bg-border/60" />
            </div>
            <div className="space-y-1.5">
              {factors.map((f) => {
                const pct = Math.min(100, (Math.abs(f.val) / maxAbs) * 100)
                const valStr = (f.val >= 0 ? "+" : "") + Math.round(f.val) + " SCI"
                const clr = f.val < -1 ? f.color : f.val > 1 ? "#8FCE5A" : "var(--muted-foreground)"
                return (
                  <div key={f.name} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: f.color }} />
                    <span className="text-[11px] font-semibold min-w-[90px]" style={{ color: clr }}>{f.name}</span>
                    <div className="flex-1 rounded h-1.5" style={{ background: "var(--muted)" }}>
                      <div className="h-full rounded transition-all duration-500" style={{ width: `${pct}%`, background: f.val < 0 ? f.color : "#8FCE5A" }} />
                    </div>
                    <span className="font-mono text-[11px] font-medium min-w-[55px] text-right" style={{ color: clr }}>{valStr}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Delta table */}
          <div className="rounded border border-border/60 bg-card/70 backdrop-blur p-4">
            <div className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
              Fibre Property Changes <span className="flex-1 h-px bg-border/60" />
            </div>
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr>
                  {["Property", "Healthy", "Adjusted", "Change"].map((h) => (
                    <th key={h} className="text-left text-[9px] font-bold tracking-[0.08em] uppercase text-muted-foreground pb-2 border-b border-border/50 px-1">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deltaRows.map(({ k, h, f }) => {
                  const chg = ((f - h) / h) * 100
                  const isBad = (k === "Yellowness +b" || k === "Micronaire") ? chg > 2 : chg < -2
                  const isGood = (k === "Yellowness +b" || k === "Micronaire") ? chg < -2 : chg > 2
                  const cls = isBad ? "#F08080" : isGood ? "#8FCE5A" : "var(--muted-foreground)"
                  return (
                    <tr key={k} className="border-b border-border/30 last:border-b-0">
                      <td className="px-1 py-1.5 font-semibold text-foreground">{k}</td>
                      <td className="px-1 py-1.5 font-mono text-muted-foreground">{h.toFixed(k.includes("mm") ? 1 : k === "Micronaire" ? 2 : 1)}{k.includes("Index") ? "%" : ""}</td>
                      <td className="px-1 py-1.5 font-mono font-medium text-foreground">{f.toFixed(k.includes("mm") ? 1 : k === "Micronaire" ? 2 : 1)}{k.includes("Index") ? "%" : ""}</td>
                      <td className="px-1 py-1.5 font-mono font-semibold" style={{ color: cls }}>{chg >= 0 ? "+" : ""}{chg.toFixed(1)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/40">
        <button onClick={onBack} className="px-5 py-2 rounded text-xs font-bold tracking-[0.06em] uppercase border border-border/60 text-muted-foreground transition-all hover:border-foreground/60 hover:text-foreground">← Back</button>
        <button onClick={() => { onStateChange({ sciHealthy: sciH, sciFinal: sciF, sciDelta }); onNext() }}
          className="px-5 py-2 rounded text-xs font-bold tracking-[0.06em] uppercase border border-foreground/70 text-foreground bg-foreground/10 transition-all hover:bg-foreground/20">
          Retrieve Market Prices →
        </button>
      </div>
    </div>
  )
}
