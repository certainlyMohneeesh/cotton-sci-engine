"use client"

import { type PipelineState } from "./pipeline-types"

interface StageMarketProps {
  state: PipelineState
  onStateChange: (updates: Partial<PipelineState>) => void
  onNext: () => void
  onBack: () => void
}

function NumberField({
  label, id, value, min, max, unit, onChange,
}: {
  label: string; id: string; value: number; min: number; max: number; unit: string
  onChange: (v: number) => void
}) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="block text-[10px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">{label}</label>
      <input id={id} type="number" value={value} min={min} max={max}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded border border-border/60 bg-background/60 px-2.5 py-1.5 font-mono text-sm font-medium text-foreground outline-none focus:border-foreground/60 transition-colors" />
      <div className="font-mono text-[10px] text-muted-foreground mt-1">{unit}</div>
    </div>
  )
}

function MarketRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-b-0">
      <span className="font-mono text-[11px] text-muted-foreground">{label}</span>
      <span className="font-mono text-[13px] font-semibold text-foreground">{value}</span>
    </div>
  )
}

export function StageMarket({ state, onStateChange, onNext, onBack }: StageMarketProps) {
  const SCIp = 145
  const SCIs = 120
  const penalty = (state.pPremium - state.pStandard) / (SCIp - SCIs)

  function update(updates: Partial<PipelineState>) {
    onStateChange({ ...updates, penalty })
  }

  const dSCI = Math.abs(Math.round(state.sciDelta))

  return (
    <div>
      {/* Stage header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
        <div className="w-10 h-10 rounded flex items-center justify-center font-mono text-lg font-semibold flex-shrink-0"
          style={{ background: "rgba(133,79,11,0.18)", color: "#E0AA60" }}>03</div>
        <div>
          <div className="font-serif text-2xl leading-none text-foreground">AGMARKNET Market Retrieval</div>
          <div className="font-mono text-[11px] text-muted-foreground mt-1 tracking-[0.04em]">
            Daily APMC mandi prices · ₹/quintal · Auto-computed penalty per SCI point
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Premium benchmark */}
        <div className="rounded border border-border/60 bg-card/70 backdrop-blur p-4">
          <div className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
            Premium Benchmark <span className="flex-1 h-px bg-border/60" />
          </div>
          <NumberField label="Shankar-6 / Long-staple price (SCI ≈ 145)" id="p-premium"
            value={state.pPremium} min={1000} max={20000} unit="₹ per quintal"
            onChange={(v) => update({ pPremium: v })} />
          <MarketRow label="SCI bracket" value="≈ 140–150" />
          <MarketRow label="Variety" value="Shankar-6" />
          <MarketRow label="Staple" value="30 mm" />
        </div>

        {/* Standard benchmark */}
        <div className="rounded border border-border/60 bg-card/70 backdrop-blur p-4">
          <div className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
            Standard Benchmark <span className="flex-1 h-px bg-border/60" />
          </div>
          <NumberField label="Local / lower-grade price (SCI ≈ 120)" id="p-standard"
            value={state.pStandard} min={1000} max={20000} unit="₹ per quintal"
            onChange={(v) => update({ pStandard: v })} />
          <MarketRow label="SCI bracket" value="≈ 115–125" />
          <MarketRow label="Category" value="Local grade" />
          <MarketRow label="Basis" value="APMC modal price" />
        </div>

        {/* Derived penalty card */}
        <div className="rounded border border-border/60 p-4 relative overflow-hidden" style={{ background: "var(--foreground)", color: "var(--background)" }}>
          <div className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase opacity-40 mb-2">Derived Penalty</div>
          <div className="font-serif text-5xl tracking-tight leading-none mb-1">₹{penalty.toFixed(1)}</div>
          <div className="font-mono text-[11px] opacity-45 mb-3">₹ per SCI point lost</div>
          <div className="font-mono text-[9px] opacity-30 leading-relaxed">
            P<sub>penalty</sub> = (P<sub>premium</sub> − P<sub>standard</sub>) / (SCI<sub>premium</sub> − SCI<sub>standard</sub>)<br />
            Updates dynamically with mandi prices
          </div>
          <div className="mt-3 pt-3" style={{ borderTop: "0.5px solid rgba(0,0,0,0.15)" }}>
            <div className="text-[9px] uppercase tracking-[0.1em] opacity-35 mb-1">ΔSCI (from model)</div>
            <div className="font-mono text-xl font-semibold">{dSCI} pts</div>
          </div>
        </div>
      </div>

      {/* Yield inputs */}
      <div className="rounded border border-border/60 bg-card/70 backdrop-blur p-4">
        <div className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
          Baseline Yield Inputs <span className="flex-1 h-px bg-border/60" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumberField label="Expected Yield (Q/ha)" id="yield-expected"
            value={state.yieldExpected} min={1} max={60} unit="quintals per hectare"
            onChange={(v) => update({ yieldExpected: v })} />
          <NumberField label="Yield Loss %" id="yield-loss-pct"
            value={state.yieldLossPct} min={0} max={100} unit="% of harvest lost to disease"
            onChange={(v) => update({ yieldLossPct: v })} />
          <NumberField label="Healthy Market Price" id="p-healthy"
            value={state.pHealthy} min={1000} max={20000} unit="₹ per quintal (disease-free)"
            onChange={(v) => update({ pHealthy: v })} />
        </div>
        <div className="rounded bg-muted/30 px-3 py-2 font-mono text-[10px] text-muted-foreground leading-relaxed mt-2">
          Yield loss % is estimated from the disease severity detected in Stage 1. This value is automatically prefilled based on disease type and severity — you may adjust it manually.
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/40">
        <button onClick={onBack} className="px-5 py-2 rounded text-xs font-bold tracking-[0.06em] uppercase border border-border/60 text-muted-foreground transition-all hover:border-foreground/60 hover:text-foreground">← Back</button>
        <button onClick={() => { onStateChange({ penalty }); onNext() }}
          className="px-5 py-2 rounded text-xs font-bold tracking-[0.06em] uppercase border transition-all"
          style={{ background: "var(--foreground)", color: "var(--background)", borderColor: "var(--foreground)" }}>
          Compute EIL Decision →
        </button>
      </div>
    </div>
  )
}
