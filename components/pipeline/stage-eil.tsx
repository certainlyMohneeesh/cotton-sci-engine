"use client"

import { useMemo } from "react"
import { type PipelineState, PIPELINE_DISEASES } from "./pipeline-types"

interface StageEILProps {
  state: PipelineState
  onStateChange: (updates: Partial<PipelineState>) => void
  onBack: () => void
  onReset: () => void
}

function inr(v: number) { return "₹" + Math.round(v).toLocaleString("en-IN") }

function CalcRow({ label, value, danger }: { label: React.ReactNode; value: string; danger?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold text-[13px]" style={{ color: danger ? "#F08080" : "var(--foreground)" }}>{value}</span>
    </div>
  )
}

export function StageEIL({ state, onStateChange, onBack, onReset }: StageEILProps) {
  const { Lyield, Lquality, Ltotal, ratio, justified } = useMemo(() => {
    const Pp = state.pPremium
    const Ps = state.pStandard
    const penalty = (Pp - Ps) / 25
    const dSCI = Math.abs(state.sciDelta) || 10

    const Ylost = state.yieldExpected * (state.yieldLossPct / 100)
    const Lyield = Ylost * state.pHealthy
    const Lquality = (state.yieldExpected - Ylost) * dSCI * penalty
    const Ltotal = Lyield + Lquality
    const ratio = Ltotal / state.treatmentCost
    return { Lyield, Lquality, Ltotal, ratio, justified: Ltotal > state.treatmentCost }
  }, [state])

  const penalty = (state.pPremium - state.pStandard) / 25
  const dSCI = Math.abs(state.sciDelta) || 10
  const Ylost = state.yieldExpected * (state.yieldLossPct / 100)

  const dis = state.disease ? PIPELINE_DISEASES[state.disease] : null

  const barMax = Math.max(Ltotal, state.treatmentCost) * 1.1
  const bars = [
    { label: "L_yield (Volume)", val: Lyield, color: "#F08080" },
    { label: "L_quality (SCI)", val: Lquality, color: "#C084FC" },
    { label: "L_total", val: Ltotal, color: "#F08080", bold: true },
    { label: "Treatment Cost C", val: state.treatmentCost, color: "#8FCE5A", bold: true },
  ]

  return (
    <div>
      {/* Stage header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
        <div className="w-10 h-10 rounded flex items-center justify-center font-mono text-lg font-semibold flex-shrink-0"
          style={{ background: "rgba(163,45,45,0.18)", color: "#F08080" }}>04</div>
        <div>
          <div className="font-serif text-2xl leading-none text-foreground">EIL Threshold Evaluation</div>
          <div className="font-mono text-[11px] text-muted-foreground mt-1 tracking-[0.04em]">
            Economic Injury Level · Bipartite Loss Function · Intervention Decision
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT – inputs + breakdown */}
        <div className="space-y-4">
          <div className="rounded border border-border/60 bg-card/70 backdrop-blur p-4">
            <div className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
              Treatment Cost <span className="flex-1 h-px bg-border/60" />
            </div>
            <label className="block text-[10px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
              Intervention cost per hectare (C)
            </label>
            <input type="number" value={state.treatmentCost} min={0} max={50000}
              onChange={(e) => onStateChange({ treatmentCost: parseFloat(e.target.value) || 0 })}
              className="w-full rounded border border-border/60 bg-background/60 px-2.5 py-1.5 font-mono text-sm font-medium text-foreground outline-none focus:border-foreground/60 transition-colors" />
            <div className="font-mono text-[10px] text-muted-foreground mt-1">₹ per hectare (foliar spray / chemical)</div>
            <div className="mt-3 rounded bg-muted/30 px-3 py-2 font-mono text-[10px] text-muted-foreground leading-relaxed">
              Regional average for whitefly vector control (CLCuV) or fungicide application (Fusarium). Adjust to your local agri-input price.
            </div>
          </div>

          <div className="rounded border border-border/60 bg-card/70 backdrop-blur p-4">
            <div className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
              Loss Computation · Equations (4.3)–(4.5) <span className="flex-1 h-px bg-border/60" />
            </div>
            <CalcRow label={<>Expected Yield (Y<sub>exp</sub>)</>} value={`${state.yieldExpected} Q/ha`} />
            <CalcRow label={<>Yield Lost (Y<sub>lost</sub>)</>} value={`${Ylost.toFixed(1)} Q/ha`} />
            <CalcRow label={<>Volume Loss (L<sub>yield</sub>)</>} value={inr(Lyield)} danger />
            <div className="my-2 border-t border-dashed border-border/40" />
            <CalcRow label="ΔSCI from model" value={`${dSCI.toFixed(1)} pts`} />
            <CalcRow label="Penalty per SCI point" value={`₹${penalty.toFixed(1)}/pt`} />
            <CalcRow label={<>Quality Loss (L<sub>quality</sub>)</>} value={inr(Lquality)} danger />
            <div className="flex justify-between items-center py-2.5 mt-1 border-t-2 border-foreground/40">
              <span className="font-semibold text-sm">Total Loss (L<sub>total</sub>)</span>
              <span className="font-mono text-lg font-bold" style={{ color: "#F08080" }}>{inr(Ltotal)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-t border-border/30">
              <span className="text-xs text-muted-foreground">Treatment Cost (C)</span>
              <span className="font-mono text-sm font-semibold" style={{ color: "#8FCE5A" }}>{inr(state.treatmentCost)}</span>
            </div>
          </div>
        </div>

        {/* RIGHT – verdict + chart + summary */}
        <div className="space-y-4">
          {/* Verdict card */}
          <div className="rounded-lg border-2 p-6 text-center transition-all relative overflow-hidden"
            style={{
              borderColor: justified ? "#F08080" : "#8FCE5A",
              background: justified ? "rgba(163,45,45,0.1)" : "rgba(45,80,22,0.1)",
            }}>
            <div className="text-4xl mb-2">{justified ? "⚠️" : "✅"}</div>
            <div className="font-serif text-2xl leading-none mb-1.5" style={{ color: justified ? "#F08080" : "#8FCE5A" }}>
              {justified ? "Intervention Justified" : "Monitor Only"}
            </div>
            <div className="font-mono text-xs opacity-60 mt-2">
              L<sub>total</sub> = {inr(Ltotal)} {justified ? ">" : "≤"} C = {inr(state.treatmentCost)}
            </div>
            <div className="inline-block mt-3 font-mono text-xs font-semibold px-3 py-1 rounded"
              style={{ background: justified ? "#F08080" : "#8FCE5A", color: "#fff" }}>
              Loss/Cost Ratio: {ratio.toFixed(1)}×
            </div>
            <div className="font-mono text-xs mt-3 opacity-60 leading-relaxed">
              {justified
                ? `Projected loss is ${ratio.toFixed(1)}× the treatment cost. Immediate action recommended.`
                : "Projected loss is below treatment cost. Continue monitoring and re-assess."}
            </div>
          </div>

          {/* Bar chart */}
          <div className="rounded border border-border/60 bg-card/70 backdrop-blur p-4">
            <div className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
              Loss vs Cost Comparison <span className="flex-1 h-px bg-border/60" />
            </div>
            <div className="space-y-2">
              {bars.map((b) => {
                const pct = ((b.val / barMax) * 100).toFixed(1)
                return (
                  <div key={b.label} className="flex items-center gap-3">
                    <div className="font-mono text-[11px] min-w-[140px]" style={{ fontWeight: b.bold ? 700 : 400, color: "var(--muted-foreground)" }}>{b.label}</div>
                    <div className="flex-1 rounded" style={{ background: "var(--muted)", height: b.bold ? "10px" : "7px" }}>
                      <div className="h-full rounded transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: b.color }} />
                    </div>
                    <div className="font-mono text-xs min-w-[80px] text-right" style={{ fontWeight: b.bold ? 700 : 400, color: b.color }}>{inr(b.val)}</div>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 rounded bg-muted/30 px-3 py-2 font-mono text-[10px] text-muted-foreground leading-relaxed">
              When L<sub>total</sub> &gt; C, intervention is economically justified. The quality-loss component (L<sub>quality</sub>) represents the SCI-coupled upgrade to classical EIL — often decisive in fibre crops.
            </div>
          </div>

          {/* Decision summary */}
          <div className="rounded border border-border/60 bg-card/70 backdrop-blur p-4">
            <div className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
              Decision Summary <span className="flex-1 h-px bg-border/60" />
            </div>
            {[
              { lbl: "Disease detected", val: dis?.label ?? "—", color: dis?.color },
              { lbl: "Severity", val: state.disease === "Healthy" ? "None" : `${state.severity}%` },
              { lbl: "SCI drop (ΔSCI)", val: `−${dSCI} SCI pts`, color: "#F08080" },
              { lbl: "Total economic loss", val: inr(Ltotal), color: "#F08080" },
              { lbl: "Treatment cost", val: inr(state.treatmentCost), color: "#8FCE5A" },
            ].map(({ lbl, val, color }) => (
              <div key={lbl} className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-b-0">
                <span className="font-mono text-[11px] text-muted-foreground">{lbl}</span>
                <span className="font-mono text-[13px] font-semibold" style={{ color: color ?? "var(--foreground)" }}>{val}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 mt-1 border-t-2 border-foreground/40">
              <span className="font-bold text-sm">Recommendation</span>
              <span className="font-mono font-bold text-sm" style={{ color: justified ? "#F08080" : "#8FCE5A" }}>
                {justified ? "⚠ INTERVENE" : "✅ MONITOR"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/40">
        <button onClick={onBack} className="px-5 py-2 rounded text-xs font-bold tracking-[0.06em] uppercase border border-border/60 text-muted-foreground transition-all hover:border-foreground/60 hover:text-foreground">← Back</button>
        <button onClick={onReset}
          className="px-5 py-2 rounded text-xs font-bold tracking-[0.06em] uppercase border border-foreground/70 text-foreground bg-foreground/10 transition-all hover:bg-foreground/20">
          ↺ New Analysis
        </button>
      </div>
    </div>
  )
}
