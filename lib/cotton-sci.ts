export type PropertyKey = "str" | "mic" | "len" | "ui" | "rd" | "yb"
export type FactorKey = "dis" | "env" | "gen" | "gin" | "con"
export type DiseaseKey =
  | "Healthy"
  | "Bacterial_Blight"
  | "Fusarium_Wilt"
  | "Curl_Virus"

export type FiberVector = Record<PropertyKey, number>
export type FactorVectors = Record<FactorKey, FiberVector>

export interface GradeBand {
  min: number
  lbl: string
  bg: string
  clr: string
}

export interface CottonControls {
  disease: DiseaseKey
  disSeverity: number
  envRain: number
  envHumid: number
  envHeat: number
  envCold: number
  genVar: number
  genEnv: number
  ginPasses: number
  ginMoist: number
  ginSpeed: number
  conTrash: number
  conSticky: number
  conSoil: number
}

type DiseaseImpacts = Partial<Record<PropertyKey, { l: number; m: number; h: number }>>

const ZERO_VECTOR: FiberVector = {
  str: 0,
  mic: 0,
  len: 0,
  ui: 0,
  rd: 0,
  yb: 0,
}

export const PROPERTY_KEYS: PropertyKey[] = ["str", "mic", "len", "ui", "rd", "yb"]
export const FACTOR_ORDER: FactorKey[] = ["dis", "env", "gen", "gin", "con"]

export const FACTOR_COLORS: Record<FactorKey, string> = {
  dis: "#A32D2D",
  env: "#185FA5",
  gen: "#3B6D11",
  gin: "#854F0B",
  con: "#993556",
}

export const FACTOR_BG_COLORS: Record<FactorKey, string> = {
  dis: "#FCEBEB",
  env: "#E6F1FB",
  gen: "#EAF3DE",
  gin: "#FAEEDA",
  con: "#FBEAF0",
}

export const FACTOR_NAMES: Record<FactorKey, string> = {
  dis: "Disease",
  env: "Environment",
  gen: "Genetics",
  gin: "Ginning",
  con: "Contamination",
}

export const FACTOR_SHORT_NAMES: Record<FactorKey, string> = {
  dis: "Disease",
  env: "Environ.",
  gen: "Genetics",
  gin: "Ginning",
  con: "Contam.",
}

export const PROPERTY_NAMES: Record<PropertyKey, string> = {
  str: "Strength",
  mic: "Micronaire",
  len: "Length",
  ui: "Uniformity",
  rd: "Rd",
  yb: "+b",
}

export const PROPERTY_FORMATTERS: Record<PropertyKey, (value: number) => string> = {
  str: (value) => value.toFixed(1),
  mic: (value) => value.toFixed(2),
  len: (value) => `${value.toFixed(3)}\"`,
  ui: (value) => `${value.toFixed(1)}%`,
  rd: (value) => value.toFixed(1),
  yb: (value) => value.toFixed(1),
}

export const GRADE_BANDS: GradeBand[] = [
  { min: 160, lbl: "Premium", bg: "#EAF3DE", clr: "#1B4D06" },
  { min: 130, lbl: "Good", bg: "#E3EFF9", clr: "#1A4A7A" },
  { min: 100, lbl: "Average", bg: "#FDF3E3", clr: "#7A4A06" },
  { min: 70, lbl: "Below Avg", bg: "#FBE8E6", clr: "#8B2015" },
  { min: 0, lbl: "Poor", bg: "#F8E0E0", clr: "#7A0F0F" },
]

export const SCALE_TIERS = [
  { lbl: "Premium", min: 160, clr: "#3B6D11" },
  { lbl: "Good", min: 130, clr: "#378ADD" },
  { lbl: "Average", min: 100, clr: "#BA7517" },
  { lbl: "Below Avg", min: 70, clr: "#D85A30" },
  { lbl: "Poor", min: 0, clr: "#A32D2D" },
] as const

export const DEFAULT_BASE_PROPERTIES: FiberVector = {
  str: 27,
  mic: 4.2,
  len: 1.1,
  ui: 81,
  rd: 74,
  yb: 9,
}

export const DEFAULT_CONTROLS: CottonControls = {
  disease: "Healthy",
  disSeverity: 50,
  envRain: 0,
  envHumid: 0,
  envHeat: 0,
  envCold: 0,
  genVar: 0,
  genEnv: 0,
  ginPasses: 1,
  ginMoist: 7,
  ginSpeed: 0,
  conTrash: 0,
  conSticky: 0,
  conSoil: 0,
}

export const DISEASES: Record<
  DiseaseKey,
  { label: string; color: string; impacts: DiseaseImpacts | null }
> = {
  Healthy: {
    label: "Healthy",
    color: "#3B6D11",
    impacts: null,
  },
  Bacterial_Blight: {
    label: "Bacterial Blight",
    color: "#C0392B",
    impacts: {
      str: { l: -2, m: -8, h: -18 },
      mic: { l: -3, m: -8, h: -15 },
      len: { l: -1, m: -4, h: -8 },
      ui: { l: -0.5, m: -1.5, h: -3 },
      rd: { l: -3, m: -8, h: -15 },
      yb: { l: 1, m: 3, h: 6 },
    },
  },
  Fusarium_Wilt: {
    label: "Fusarium Wilt",
    color: "#D4850A",
    impacts: {
      str: { l: -3, m: -12, h: -25 },
      mic: { l: -5, m: -15, h: -30 },
      len: { l: -2, m: -8, h: -18 },
      ui: { l: -1, m: -3, h: -6 },
      rd: { l: -2, m: -6, h: -12 },
      yb: { l: 1, m: 4, h: 8 },
    },
  },
  Curl_Virus: {
    label: "Curl Virus",
    color: "#7B2D8B",
    impacts: {
      str: { l: -2, m: -7.5, h: -15 },
      mic: { l: -1, m: -4, h: -8 },
      len: { l: -3, m: -10, h: -20 },
      ui: { l: -0.5, m: -1.5, h: -4 },
      rd: { l: -1, m: -3, h: -7 },
      yb: { l: 1, m: 3, h: 6 },
    },
  },
}

export function interpolateDiseaseImpact(
  definition: { l: number; m: number; h: number } | undefined,
  severity: number
): number {
  if (!definition) return 0
  if (severity <= 25) return definition.l * (severity / 25)
  if (severity <= 60) return definition.l + (definition.m - definition.l) * ((severity - 25) / 35)
  if (severity <= 80) return definition.m + (definition.h - definition.m) * ((severity - 60) / 20)
  return definition.h
}

export function calcSCI(str: number, mic: number, len: number, ui: number, rd: number, yb: number): number {
  return -414.67 + 2.9 * str - 9.32 * mic + 49.17 * len + 4.74 * ui + 0.65 * rd + 0.36 * yb
}

export function getGrade(score: number): GradeBand {
  for (const grade of GRADE_BANDS) {
    if (score >= grade.min) return grade
  }
  return GRADE_BANDS[GRADE_BANDS.length - 1]
}

export function getSeverityLabel(percent: number): string {
  if (percent <= 20) return "None"
  if (percent <= 40) return "Mild"
  if (percent <= 65) return "Moderate"
  if (percent <= 85) return "High"
  return "Severe"
}

export function getPassesLabel(passes: number): string {
  if (passes === 0) return "None"
  return `${passes} pass${passes > 1 ? "es" : ""}`
}

export function getGinSpeedLabel(speed: number): string {
  return ["Optimal", "Slightly aggressive", "Poor - over-ginned"][speed] ?? "Optimal"
}

export function computeFactorDeltas(base: FiberVector, controls: CottonControls): FactorVectors {
  const disease = DISEASES[controls.disease]

  const dis: FiberVector = {
    str: interpolateDiseaseImpact(disease.impacts?.str, controls.disSeverity),
    mic: interpolateDiseaseImpact(disease.impacts?.mic, controls.disSeverity),
    len: interpolateDiseaseImpact(disease.impacts?.len, controls.disSeverity),
    ui: interpolateDiseaseImpact(disease.impacts?.ui, controls.disSeverity),
    rd: interpolateDiseaseImpact(disease.impacts?.rd, controls.disSeverity),
    yb: interpolateDiseaseImpact(disease.impacts?.yb, controls.disSeverity),
  }

  const rain = controls.envRain / 100
  const humid = controls.envHumid / 100
  const heat = controls.envHeat / 100
  const cold = controls.envCold / 100
  const env: FiberVector = {
    str: 0,
    mic: heat * 8 - cold * 6,
    len: -(heat * 8 + cold * 4),
    ui: -(heat * 2 + cold * 1.5),
    rd: -(rain * 18 + humid * 10),
    yb: rain * 7 + humid * 4,
  }

  const genFit = controls.genEnv / 100
  const gen: FiberVector = {
    str: controls.genVar * 6 + genFit * 3,
    mic: -controls.genVar * 0.3,
    len: controls.genVar * 5 + genFit * 2.5,
    ui: controls.genVar * 2 + genFit,
    rd: 0,
    yb: 0,
  }

  const lengthLossMM =
    controls.ginPasses * 0.35 + (controls.ginMoist < 5 ? (5 - controls.ginMoist) * 0.01 * 25.4 : 0) + controls.ginSpeed * 0.25
  const lengthLossPct = -(lengthLossMM / base.len) * 100 * (1 / 25.4)
  const uiLoss = -(controls.ginPasses * 0.8 + controls.ginSpeed * 0.7)
  const gin: FiberVector = {
    str: -(controls.ginSpeed * 3),
    mic: 0,
    len: lengthLossPct,
    ui: uiLoss,
    rd: 0,
    yb: 0,
  }

  const trash = controls.conTrash / 100
  const sticky = controls.conSticky / 100
  const soil = controls.conSoil / 100
  const con: FiberVector = {
    str: -(sticky * 4 + soil * 2),
    mic: trash * 8,
    len: -(trash * 2),
    ui: -(trash * 1.5 + sticky),
    rd: -(soil * 12 + trash * 5),
    yb: soil * 4 + trash * 2,
  }

  return { dis, env, gen, gin, con }
}

export interface CottonModelEvaluation {
  healthySCI: number
  finalSCI: number
  loss: number
  lossPercent: number
  healthyGrade: GradeBand
  finalGrade: GradeBand
  factorDeltas: FactorVectors
  combinedDeltas: FiberVector
  finalProperties: FiberVector
  factorContributions: Record<FactorKey, number>
}

export function evaluateCottonModel(base: FiberVector, controls: CottonControls): CottonModelEvaluation {
  const factorDeltas = computeFactorDeltas(base, controls)
  const healthySCI = calcSCI(base.str, base.mic, base.len, base.ui, base.rd, base.yb)

  const combinedDeltas: FiberVector = { ...ZERO_VECTOR }
  for (const factor of FACTOR_ORDER) {
    for (const property of PROPERTY_KEYS) {
      combinedDeltas[property] += factorDeltas[factor][property] ?? 0
    }
  }

  const finalProperties: FiberVector = {
    ...ZERO_VECTOR,
    str: base.str * (1 + combinedDeltas.str / 100),
    mic: base.mic * (1 + combinedDeltas.mic / 100),
    len: base.len * (1 + combinedDeltas.len / 100),
    ui: base.ui * (1 + combinedDeltas.ui / 100),
    rd: base.rd * (1 + combinedDeltas.rd / 100),
    yb:
      base.yb * (1 + Math.abs(combinedDeltas.yb) / 100) * (combinedDeltas.yb > 0 ? 1 : combinedDeltas.yb < 0 ? 0.99 : 1),
  }

  const finalSCI = calcSCI(
    finalProperties.str,
    finalProperties.mic,
    finalProperties.len,
    finalProperties.ui,
    finalProperties.rd,
    finalProperties.yb
  )

  // Keep parity with the original script where +b is not carried cumulatively in factor contribution steps.
  let cumulative: FiberVector = { ...base }
  let previousSCI = healthySCI
  const factorContributions: Record<FactorKey, number> = {
    dis: 0,
    env: 0,
    gen: 0,
    gin: 0,
    con: 0,
  }

  for (const factor of FACTOR_ORDER) {
    const delta = factorDeltas[factor]
    const next: FiberVector = {
      str: cumulative.str * (1 + (delta.str ?? 0) / 100),
      mic: cumulative.mic * (1 + (delta.mic ?? 0) / 100),
      len: cumulative.len * (1 + (delta.len ?? 0) / 100),
      ui: cumulative.ui * (1 + (delta.ui ?? 0) / 100),
      rd: cumulative.rd * (1 + (delta.rd ?? 0) / 100),
      yb: cumulative.yb * (1 + Math.abs(delta.yb ?? 0) / 100),
    }

    const stepSCI = calcSCI(next.str, next.mic, next.len, next.ui, next.rd, cumulative.yb * (1 + Math.abs(delta.yb ?? 0) / 100))
    factorContributions[factor] = stepSCI - previousSCI
    cumulative = { ...cumulative, str: next.str, mic: next.mic, len: next.len, ui: next.ui, rd: next.rd }
    previousSCI = stepSCI
  }

  const loss = finalSCI - healthySCI

  return {
    healthySCI,
    finalSCI,
    loss,
    lossPercent: (loss / Math.abs(healthySCI)) * 100,
    healthyGrade: getGrade(healthySCI),
    finalGrade: getGrade(finalSCI),
    factorDeltas,
    combinedDeltas,
    finalProperties,
    factorContributions,
  }
}