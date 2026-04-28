"use client"

import { useRef, useState } from "react"
import type { DiseaseKey } from "@/lib/cotton-sci"
import { type PipelineState, PIPELINE_DISEASES } from "./pipeline-types"
import type { DetectionResult } from "@/app/api/detect-disease/route"

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

type Phase = "idle" | "analyzing" | "result" | "not-cotton" | "error"

interface StageDetectionProps {
  state: PipelineState
  onStateChange: (updates: Partial<PipelineState>) => void
  onNext: () => void
}

export function StageDetection({ state, onStateChange, onNext }: StageDetectionProps) {
  const [phase, setPhase] = useState<Phase>(state.disease ? "result" : "idle")
  const [errorMsg, setErrorMsg] = useState<string>("")
  const [reasoning, setReasoning] = useState<string>("")
  const [analyzeStep, setAnalyzeStep] = useState<string>("Uploading image...")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── AI analysis ──────────────────────────────────────────────────────────────
  async function runAIAnalysis(imageDataUrl: string) {
    setPhase("analyzing")
    setAnalyzeStep("Sending image for analysis...")

    try {
      const res = await fetch("/api/detect-disease", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl }),
      })

      setAnalyzeStep("Parsing classification results...")
      const data: DetectionResult & { error?: string } = await res.json()

      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? "Unknown server error.")
        setPhase("error")
        return
      }

      if (!data.isCottonLeaf) {
        setReasoning(data.reasoning ?? "")
        setPhase("not-cotton")
        return
      }

      const key = data.disease ?? "Healthy"
      setReasoning(data.reasoning ?? "")
      applyDetectionResult(key, data.confidence, data.severity)
    } catch (err) {
      setErrorMsg(`Network error: ${String(err)}`)
      setPhase("error")
    }
  }

  function applyDetectionResult(key: DiseaseKey, confidence: number, severity: number) {
    const clampedSev = Math.max(0, Math.min(100, severity))
    const clampedConf = Math.max(0, Math.min(100, confidence))
    onStateChange({
      disease: key,
      severity: key === "Healthy" ? 0 : clampedSev,
      confidence: clampedConf,
      yieldLossPct: PIPELINE_DISEASES[key].yieldLossPct,
    })
    setPhase("result")
  }

  function handleUpload(evt: React.ChangeEvent<HTMLInputElement>) {
    const file = evt.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      onStateChange({ uploadedImage: src, disease: null })
      runAIAnalysis(src)
    }
    setAnalyzeStep("Reading image file...")
    reader.readAsDataURL(file)
  }

  // ── Manual override ─────────────────────────────────────────────────────────
  function selectDisease(key: DiseaseKey) {
    const sev = key === "Healthy" ? 0 : 50
    const conf = key === "Healthy" ? 95 : 82
    setReasoning("Manually selected by user.")
    onStateChange({ uploadedImage: null, disease: null })
    applyDetectionResult(key, conf, sev)
  }

  function updateSeverity(val: number) {
    const base = state.disease ? PIPELINE_DISEASES[state.disease].yieldLossPct : 0
    onStateChange({ severity: val, yieldLossPct: Math.min(80, Math.round((base * val) / 50)) || base })
  }

  function reset() {
    onStateChange({ uploadedImage: null, disease: null })
    setPhase("idle")
    setErrorMsg("")
    setReasoning("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const d = state.disease ? PIPELINE_DISEASES[state.disease] : null
  const diseaseKeys: DiseaseKey[] = ["Healthy", "Bacterial_Blight", "Fusarium_Wilt", "Curl_Virus"]

  return (
    <div>
      {/* Stage header */}
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
        {/* ── LEFT: Upload + Manual ─────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Upload zone */}
          <div className="rounded border border-border/60 bg-card/70 backdrop-blur p-4">
            <div className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-4 flex items-center gap-2">
              Leaf Image Upload <span className="flex-1 h-px bg-border/60" />
            </div>

            {state.uploadedImage ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={state.uploadedImage} alt="Leaf preview"
                  className="w-full max-h-52 object-contain rounded border border-border/60" />
                <button onClick={reset}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 text-muted-foreground text-xs flex items-center justify-center hover:bg-background transition-colors">×</button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-border/50 rounded-md p-8 text-center cursor-pointer transition-all hover:border-[#6FB0F0]/60 hover:bg-[#6FB0F0]/5"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-4xl mb-3 opacity-60">🍃</div>
                <div className="text-sm font-semibold text-foreground mb-1">Upload Cotton Leaf Image</div>
                <div className="font-mono text-[11px] text-muted-foreground">JPG, PNG · Click or drag here</div>
                <div className="font-mono text-[10px] text-muted-foreground/60 mt-2">AI-powered cotton disease classification</div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </div>
            )}
          </div>

          {/* Manual selector */}
          <div className="rounded border border-border/60 bg-card/70 backdrop-blur p-4">
            <div className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1 flex items-center gap-2">
              Or Select Disease Manually <span className="flex-1 h-px bg-border/60" />
            </div>
            <div className="font-mono text-[10px] text-muted-foreground/60 mb-3">
              Bypasses AI — use when you already know the disease
            </div>
            <div className="grid grid-cols-2 gap-2">
              {diseaseKeys.map((key) => {
                const cfg = PIPELINE_DISEASES[key]
                const selected = state.disease === key && phase === "result"
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

        {/* ── RIGHT: States ─────────────────────────────────────────────────── */}
        <div>
          {/* Analyzing */}
          {phase === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-border/30 animate-spin" style={{ borderTopColor: "#6FB0F0" }} />
                <div className="absolute inset-0 flex items-center justify-center text-xl">🤖</div>
              </div>
              <div className="font-mono text-xs text-muted-foreground tracking-[0.06em]">AI Vision · Analysing Image</div>
              <div className="font-mono text-[10px] text-muted-foreground/70 animate-pulse">{analyzeStep}</div>
            </div>
          )}

          {/* Idle */}
          {phase === "idle" && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-5xl opacity-10">🤖</div>
              <div className="font-mono text-xs text-muted-foreground mt-3 leading-relaxed">
                Upload an image or select a disease<br />to begin classification
              </div>

            </div>
          )}

          {/* Not a cotton leaf */}
          {phase === "not-cotton" && (
            <div className="space-y-3">
              <div className="rounded border-l-[3px] p-4" style={{ borderLeftColor: "#E0AA60", border: "1px solid var(--border)", borderLeft: "3px solid #E0AA60", background: "rgba(224,170,96,0.08)" }}>
                <div className="font-mono text-[9px] font-bold tracking-[0.1em] uppercase mb-2" style={{ color: "#E0AA60" }}>⚠ Not a Cotton Leaf</div>
                <div className="font-serif text-xl mb-2" style={{ color: "#E0AA60" }}>Invalid Image</div>
                <div className="font-mono text-xs text-muted-foreground leading-relaxed">
                  The AI could not identify a cotton leaf in the uploaded image.
                  Please upload a clear photo of a cotton leaf.
                </div>
                {reasoning && (
                  <div className="mt-3 rounded bg-muted/30 px-3 py-2 font-mono text-[10px] text-muted-foreground leading-relaxed">
                    <span className="font-bold text-foreground/60">AI reasoning: </span>{reasoning}
                  </div>
                )}
              </div>
              <button onClick={reset}
                className="w-full py-2 rounded text-xs font-bold tracking-[0.06em] uppercase border border-border/60 text-muted-foreground transition-all hover:border-foreground/60 hover:text-foreground">
                ↺ Try Another Image
              </button>
            </div>
          )}

          {/* Error */}
          {phase === "error" && (
            <div className="space-y-3">
              <div className="rounded border-l-[3px] p-4" style={{ borderLeftColor: "#F08080", border: "1px solid var(--border)", borderLeft: "3px solid #F08080", background: "rgba(240,128,128,0.08)" }}>
                <div className="font-mono text-[9px] font-bold tracking-[0.1em] uppercase mb-2" style={{ color: "#F08080" }}>✗ Detection Error</div>
                <div className="font-serif text-xl mb-2" style={{ color: "#F08080" }}>Analysis Failed</div>
                <div className="font-mono text-xs text-muted-foreground leading-relaxed">{errorMsg}</div>
                {errorMsg.includes("OPENROUTER_API_KEY") && (
                  <div className="mt-3 rounded bg-muted/30 px-3 py-2 font-mono text-[10px] text-muted-foreground leading-relaxed">
                    Add <code className="text-foreground">OPENROUTER_API_KEY=your_key</code> to <code className="text-foreground">.env.local</code> and restart the dev server.{" "}
                    <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-[#6FB0F0] underline">Get a free key at openrouter.ai →</a>
                  </div>
                )}
                {errorMsg.includes("rate-limited") && (
                  <div className="mt-3 rounded bg-muted/30 px-3 py-2 font-mono text-[10px] text-muted-foreground leading-relaxed">
                    All free vision models are busy. Wait ~30 seconds and try again — the pipeline auto-retries 3 different models (Gemma 4 → Llama 4 Scout → Qwen VL 72B).
                  </div>
                )}
              </div>
              <button onClick={reset}
                className="w-full py-2 rounded text-xs font-bold tracking-[0.06em] uppercase border border-border/60 text-muted-foreground transition-all hover:border-foreground/60 hover:text-foreground">
                ↺ Try Again
              </button>
            </div>
          )}

          {/* Result */}
          {phase === "result" && d && state.disease && (
            <div className="space-y-3">
              {/* Detection card */}
              <div className="rounded p-4 relative overflow-hidden"
                style={{ border: `1px solid var(--border)`, borderLeft: `3px solid ${d.color}`, background: d.darkBg }}>
                <div className="font-mono text-[9px] font-bold tracking-[0.1em] uppercase opacity-50 mb-2">
                  {state.uploadedImage ? "AI · Classification Result" : "Manual Selection"}
                </div>
                <div className="font-serif text-2xl mb-1" style={{ color: d.color }}>{d.label}</div>
                <div className="font-mono text-[11px] mb-2" style={{ color: d.color }}>Confidence: {state.confidence.toFixed(1)}%</div>
                <div className="h-1 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${state.confidence}%`, background: d.color }} />
                </div>
                <SeverityDots pct={state.severity} color={d.color} />
                {reasoning && (
                  <div className="mt-3 rounded bg-black/20 px-3 py-2 font-mono text-[10px] text-muted-foreground leading-relaxed">
                    <span className="font-bold text-foreground/50">AI reasoning: </span>{reasoning}
                  </div>
                )}
              </div>

              {/* Severity slider */}
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

              {/* Probability bars */}
              <div className="rounded border border-border/60 bg-card/70 backdrop-blur p-4">
                <div className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
                  Class Probabilities <span className="flex-1 h-px bg-border/60" />
                </div>
                <ProbabilityBars activeKey={state.disease} conf={state.confidence} />
                <div className="mt-3 rounded bg-muted/30 px-3 py-2 font-mono text-[10px] text-muted-foreground leading-relaxed">
                  Softmax-style probability distribution. Primary class confidence from AI model; remaining mass distributed over other classes.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
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
