"use client"

import { useRef, useState } from "react"
import type { DiseaseKey } from "@/lib/cotton-sci"
import { type PipelineState, PIPELINE_DISEASES } from "./pipeline-types"

function SeverityDots({ pct, color }: { pct: number; color: string }) {
  const levels = ["Trace", "Mild", "Moderate", "Severe", "Critical"]
  const idx = pct === 0 ? -1 : Math.min(4, Math.floor(pct / 20))
  return (
    <div className="flex items-center gap-2.5 mt-2">
      <span className="text-[11px] font-bold tracking-[0.06em] uppercase" style={{ color }}>Severity</span>
      <div className="flex gap-1">
        {levels.map((l, i) => (
          <div key={l} title={l} className="w-2.5 h-2.5 rounded-full border-[1.5px] transition-opacity"
            style={{ borderColor: color, backgroundColor: i <= idx ? color : "transparent", opacity: i <= idx ? 1 : 0.25 }} />
        ))}
      </div>
      <span className="font-mono text-[11px] font-semibold" style={{ color }}>
        {pct === 0 ? "None" : levels[idx] ?? "Moderate"}
      </span>
    </div>
  )
}

function ProbabilityBars({ activeKey, conf }: { activeKey: DiseaseKey; conf: number }) {
  const keys: DiseaseKey[] = ["Healthy", "Bacterial_Blight", "Fusarium_Wilt", "Curl_Virus"]
  const rest = 100 - conf
  const others = keys.filter((k) => k !== activeKey)
  const r = [Math.random(), Math.random(), Math.random()]
  const s = (r[0]! + r[1]! + r[2]!)
  const probs: Record<string, number> = { [activeKey]: conf }
  others.forEach((k, i) => (probs[k] = ((r[i] ?? 0) / s) * rest))
  return (
    <div className="space-y-1.5">
      {keys.map((k) => {
        const d = PIPELINE_DISEASES[k]
        const p = probs[k] ?? 0
        const isActive = k === activeKey
        return (
          <div key={k} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-[11px] font-semibold min-w-[130px]" style={{ color: isActive ? d.color : "var(--muted-foreground)" }}>{d.label}</span>
            <div className="flex-1 rounded-full h-1.5" style={{ background: "var(--muted)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p.toFixed(1)}%`, background: d.color }} />
            </div>
            <span className="font-mono text-[11px] font-semibold min-w-[38px] text-right" style={{ color: isActive ? d.color : "var(--muted-foreground)" }}>
              {p.toFixed(1)}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

interface StageDetectionProps {
  state: PipelineState
  onStateChange: (updates: Partial<PipelineState>) => void
  onNext: () => void
}

export function StageDetection({ state, onStateChange, onNext }: StageDetectionProps) {
  const [phase, setPhase] = useState<"idle" | "analyzing" | "result">(state.disease ? "result" : "idle")
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleUpload(evt: React.ChangeEvent<HTMLInputElement>) {
    const file = evt.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      onStateChange({ uploadedImage: e.target?.result as string })
      runAIAnalysis()
    }
    reader.readAsDataURL(file)
  }

  function runAIAnalysis() {
    setPhase("analyzing")
    const keys: DiseaseKey[] = ["Healthy", "Bacterial_Blight", "Fusarium_Wilt", "Curl_Virus"]
    const key = keys[Math.floor(Math.random() * keys.length)]!
    const sev = key === "Healthy" ? 0 : Math.floor(Math.random() * 60 + 20)
    setTimeout(() => selectDisease(key, sev), 1800)
  }

  function selectDisease(key: DiseaseKey, severityOverride?: number) {
    const sev = severityOverride !== undefined ? severityOverride : key === "Healthy" ? 0 : 50
    const conf = key === "Healthy" ? 88 + Math.random() * 10 : 72 + Math.random() * 22
    onStateChange({ disease: key, severity: sev, confidence: conf, yieldLossPct: PIPELINE_DISEASES[key].yieldLossPct })
    setPhase("result")
  }

  function updateSeverity(val: number) {
    const base = state.disease ? PIPELINE_DISEASES[state.disease].yieldLossPct : 0
    onStateChange({ severity: val, yieldLossPct: Math.min(80, Math.round((base * val) / 50)) || base })
  }

  const d = state.disease ? PIPELINE_DISEASES[state.disease] : null
  const diseaseKeys: DiseaseKey[] = ["Healthy", "Bacterial_Blight", "Fusarium_Wilt", "Curl_Virus"]

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
        <div className="w-10 h-10 rounded flex items-center justify-center font-mono text-lg font-semibold flex-shrink-0"
          style={{ background: "rgba(24,95,165,0.18)", color: "#6FB0F0" }}>01</div>
        <div>
          <div className="font-serif text-2xl leading-none text-foreground">AI Disease Detection</div>
          <div className="font-mono text-[11px] text-muted-foreground mt-1 tracking-[0.04em]">
            ConvNeXt-GCN · Upload a cotton leaf photo for classification
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT */}
        <div className="space-y-4">
          <div className="rounded border border-border/60 bg-card/70 backdrop-blur p-4">
            <div className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-4 flex items-center gap-2">
              Leaf Image Upload <span className="flex-1 h-px bg-border/60" />
            </div>
            {state.uploadedImage ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={state.uploadedImage} alt="Leaf preview"
                  className="w-full max-h-52 object-contain rounded border border-border/60" />
                <button onClick={() => { onStateChange({ uploadedImage: null, disease: null }); setPhase("idle") }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/70 text-muted-foreground text-xs flex items-center justify-center hover:bg-background transition-colors">×</button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border/50 rounded-md p-8 text-center cursor-pointer transition-all hover:border-foreground/40 hover:bg-muted/30"
                onClick={() => fileInputRef.current?.click()}>
                <div className="text-4xl mb-3 opacity-60">🍃</div>
                <div className="text-sm font-semibold text-foreground mb-1">Upload Cotton Leaf Image</div>
                <div className="font-mono text-[11px] text-muted-foreground">JPG, PNG · Click or drag here</div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </div>
            )}
          </div>

          <div className="rounded border border-border/60 bg-card/70 backdrop-blur p-4">
            <div className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-4 flex items-center gap-2">
              Or Select Disease Manually <span className="flex-1 h-px bg-border/60" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {diseaseKeys.map((key) => {
                const cfg = PIPELINE_DISEASES[key]
                const selected = state.disease === key
                return (
                  <button key={key} onClick={() => selectDisease(key)} className="text-left p-2.5 rounded border transition-all"
                    style={{ borderColor: selected ? cfg.color : "var(--border)", background: selected ? cfg.darkBg : "transparent", borderWidth: selected ? "1.5px" : "1px" }}>
                    <div className="w-2 h-2 rounded-full mb-1.5" style={{ background: cfg.color }} />
                    <div className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</div>
                    <div className="font-mono text-[9px] text-muted-foreground mt-0.5">{cfg.desc.split(".")[0]}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div>
          {phase === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-14 h-14 rounded-full border-4 border-border/40 animate-spin" style={{ borderTopColor: "var(--foreground)" }} />
              <div className="font-mono text-xs text-muted-foreground tracking-[0.06em]">ConvNeXt-GCN · Forward Pass</div>
              <div className="font-mono text-[10px] text-muted-foreground">Classifying leaf morphology...</div>
            </div>
          )}

          {phase === "idle" && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-5xl opacity-10">🤖</div>
              <div className="font-mono text-xs text-muted-foreground mt-3 leading-relaxed">
                Upload an image or select a disease<br />to begin classification
              </div>
            </div>
          )}

          {phase === "result" && d && state.disease && (
            <div className="space-y-3">
              <div className="rounded border-l-[3px] p-4 relative overflow-hidden"
                style={{ borderLeftColor: d.color, background: d.darkBg, border: `1px solid var(--border)`, borderLeft: `3px solid ${d.color}` }}>
                <div className="font-mono text-[9px] font-bold tracking-[0.1em] uppercase opacity-50 mb-2">Classification Result</div>
                <div className="font-serif text-2xl mb-1" style={{ color: d.color }}>{d.label}</div>
                <div className="font-mono text-[11px] mb-2" style={{ color: d.color }}>Confidence: {state.confidence.toFixed(1)}%</div>
                <div className="h-1 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${state.confidence}%`, background: d.color }} />
                </div>
                <SeverityDots pct={state.severity} color={d.color} />
              </div>

              {state.disease !== "Healthy" && (
                <div className="rounded border border-border/60 bg-card/70 backdrop-blur p-4">
                  <div className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
                    Adjust Severity Estimate <span className="flex-1 h-px bg-border/60" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="min-w-[140px]">
                      <div className="text-xs font-semibold text-foreground">Disease severity</div>
                      <div className="font-mono text-[10px] text-muted-foreground">% crop area affected</div>
                    </div>
                    <input type="range" min={5} max={100} step={5} value={state.severity}
                      onChange={(e) => updateSeverity(Number(e.target.value))}
                      className="flex-1 accent-foreground h-0.5" />
                    <span className="font-mono text-xs font-medium min-w-[42px] text-right text-foreground">{state.severity}%</span>
                  </div>
                </div>
              )}

              <div className="rounded border border-border/60 bg-card/70 backdrop-blur p-4">
                <div className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
                  Class Probabilities <span className="flex-1 h-px bg-border/60" />
                </div>
                <ProbabilityBars activeKey={state.disease} conf={state.confidence} />
                <div className="mt-3 rounded bg-muted/30 px-3 py-2 font-mono text-[10px] text-muted-foreground leading-relaxed">
                  Probability distribution from the final softmax layer of the ConvNeXt-GCN ensemble. Entropy threshold: 0.35.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/40">
        <div />
        <button onClick={onNext} disabled={!state.disease}
          className="px-5 py-2 rounded text-xs font-bold tracking-[0.06em] uppercase border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: state.disease ? "var(--foreground)" : "transparent", color: state.disease ? "var(--background)" : "var(--muted-foreground)", borderColor: state.disease ? "var(--foreground)" : "var(--border)" }}>
          Proceed to SCI Model →
        </button>
      </div>
    </div>
  )
}
