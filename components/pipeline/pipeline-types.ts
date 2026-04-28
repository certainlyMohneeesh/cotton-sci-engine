import type { DiseaseKey } from "@/lib/cotton-sci"

export type PipelineStage = 1 | 2 | 3 | 4

// ─── Disease metadata (used by Stage 1 and Stage 2) ──────────────────────────

export interface DiseaseConfig {
  label: string
  color: string
  bg: string
  darkBg: string
  icon: string
  yieldLossPct: number
  /** Percentage delta per property, scaled by severity/100 */
  deltas: { str: number; mic: number; len: number; ui: number; rd: number; yb: number }
  desc: string
}

export const PIPELINE_DISEASES: Record<DiseaseKey, DiseaseConfig> = {
  Healthy: {
    label: "Healthy Leaf",
    color: "#4ADE80",
    bg: "#EAF3DE",
    darkBg: "rgba(45,80,22,0.25)",
    icon: "🌿",
    yieldLossPct: 0,
    deltas: { str: 0, mic: 0, len: 0, ui: 0, rd: 0, yb: 0 },
    desc: "No disease detected. Fibre properties at expected baseline.",
  },
  Bacterial_Blight: {
    label: "Bacterial Blight",
    color: "#F87171",
    bg: "#FCEBEB",
    darkBg: "rgba(192,57,43,0.22)",
    icon: "🔴",
    yieldLossPct: 25,
    deltas: { str: -12, mic: 0, len: -5, ui: -4, rd: -8, yb: 4 },
    desc: "Angular water-soaked lesions. Boll shedding causes direct yield loss.",
  },
  Fusarium_Wilt: {
    label: "Fusarium Wilt",
    color: "#FB923C",
    bg: "#FEF3E2",
    darkBg: "rgba(212,133,10,0.22)",
    icon: "🟠",
    yieldLossPct: 20,
    deltas: { str: -8, mic: -0.3, len: -7, ui: -5, rd: -6, yb: 2 },
    desc: "Vascular disease causes wilting and necrosis. Incomplete boll fill reduces fibre length.",
  },
  Curl_Virus: {
    label: "CLCuV (Leaf Curl)",
    color: "#C084FC",
    bg: "#F5EAF8",
    darkBg: "rgba(123,45,139,0.22)",
    icon: "🟣",
    yieldLossPct: 15,
    deltas: { str: -6, mic: 0.4, len: -4, ui: -3, rd: -5, yb: 3 },
    desc: "Whitefly-vectored begomovirus. Leaf curling reduces photosynthesis and boll development.",
  },
}

// ─── Pipeline-wide shared state ───────────────────────────────────────────────

export interface PipelineState {
  // Stage 1
  disease: DiseaseKey | null
  severity: number            // 0–100
  confidence: number
  uploadedImage: string | null

  // Stage 2 – base fiber sliders
  fiberStr: number            // g/tex  18–38
  fiberMic: number            // 2.5–6.5
  fiberLenIn: number          // inches 0.85–1.35 (converted to mm for formula)
  fiberUI: number             // % 74–88
  fiberRd: number             // 60–85
  fiberYb: number             // 6–16
  ginPasses: number           // 0–3
  envHeat: number             // 0–100
  envRain: number             // 0–100
  genVar: number              // -1 to 1

  // Computed (set after Stage 2 calculations)
  sciHealthy: number
  sciFinal: number
  sciDelta: number

  // Stage 3 – market
  pPremium: number            // ₹/quintal
  pStandard: number           // ₹/quintal
  yieldExpected: number       // Q/ha
  yieldLossPct: number        // %
  pHealthy: number            // ₹/quintal
  penalty: number             // ₹/SCI point

  // Stage 4
  treatmentCost: number       // ₹/ha
}

export const DEFAULT_PIPELINE_STATE: PipelineState = {
  disease: null,
  severity: 50,
  confidence: 0,
  uploadedImage: null,

  fiberStr: 27,
  fiberMic: 4.2,
  fiberLenIn: 1.10,
  fiberUI: 81,
  fiberRd: 74,
  fiberYb: 9,
  ginPasses: 1,
  envHeat: 0,
  envRain: 0,
  genVar: 0,

  sciHealthy: 0,
  sciFinal: 0,
  sciDelta: 0,

  pPremium: 8850,
  pStandard: 6800,
  yieldExpected: 20,
  yieldLossPct: 15,
  pHealthy: 8850,
  penalty: 0,

  treatmentCost: 2500,
}
