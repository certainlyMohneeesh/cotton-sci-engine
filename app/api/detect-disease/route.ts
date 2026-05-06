import type { DiseaseKey } from "@/lib/cotton-sci"
import { GoogleGenAI } from '@google/genai'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DetectionResult {
  isCottonLeaf: boolean
  disease: DiseaseKey | null
  confidence: number   // 0–100
  severity: number     // 0–100
  reasoning: string
  modelUsed?: string   // which model actually responded
}

// ─── OpenRouter config ────────────────────────────────────────────────────────
//
// Free vision models tried in order — if one is rate-limited (429) or returns
// unparseable output, the next is attempted automatically.

const OR_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"

const FALLBACK_MODELS = [
  "nvidia/nemotron-nano-12b-v2-vl:free",                          // Gemma 4 — primary
  "openai/gpt-oss-120b:free",                            // Llama 4 Scout — fallback 1
  "openai/gpt-oss-20b:free",                       // Qwen VL 72B — fallback 2
]

// ─── Prompt ───────────────────────────────────────────────────────────────────
//
// Highly detailed differential diagnosis prompt. The key improvement is giving
// explicit DISTINGUISHING features between diseases so the model can separate
// Fusarium Wilt from Bacterial Blight (which share brown lesions) and CLCuV
// from mechanical curl damage.

const SYSTEM_PROMPT = `You are an expert phytopathologist specialised in Gossypium (cotton) diseases.
Your task: classify a single image into one of four classes and return ONLY a JSON object.

CRITICAL OUTPUT RULES:
1. Return ONLY a valid JSON object. No markdown. No code fences. No explanation before or after.
2. Keep "reasoning" under 25 words. Be concise.
3. The JSON must be complete and parseable.

JSON schema (return exactly this structure):
{"isCottonLeaf":true,"disease":"Healthy","confidence":90,"severity":0,"reasoning":"short text"}

Field definitions:
- isCottonLeaf: true ONLY if the image shows a cotton (Gossypium) plant part. False for all other plants, objects, animals, people.
- disease: one of "Healthy", "Bacterial_Blight", "Fusarium_Wilt", "Curl_Virus", or null (if not cotton).
- confidence: integer 0–100.
- severity: integer 0–100 (percent of visible leaf area affected). Always 0 for Healthy.
- reasoning: max 25 words describing the key visual evidence.

═══ DIFFERENTIAL DIAGNOSIS KEY ═══

Use this decision tree strictly:

STEP 1 — Is it a cotton leaf?
Cotton leaves are palmate (3–5 lobes), alternate arrangement, with visible palmate venation. If not cotton → isCottonLeaf: false, disease: null.

STEP 2 — Check for LEAF CURLING first:
• If leaves are curled upward/downward, cupped, crinkled, or show vein thickening/swelling → "Curl_Virus"
  KEY SIGNS: Leaf lamina deformed, veins abnormally thick/enated, interveinal area puckered, stunted new growth.
  DISTINGUISHING: Curl_Virus does NOT produce necrotic brown lesions. The leaf tissue stays green but deforms.

STEP 3 — If no curling, check LESION PATTERN:
• "Bacterial_Blight" — ANGULAR lesions bounded by leaf veins:
  - Lesions are ANGULAR (straight-edged), following the vein network, giving a geometric/polygonal appearance.
  - Lesions start as small dark water-soaked spots that enlarge into angular brown-black patches.
  - Yellow halo surrounds each lesion.
  - On backlight, lesions appear translucent/water-soaked.
  - Lesions are scattered across the leaf blade, NOT concentrated at margins.
  - Affected areas turn dark brown/black and may become papery-dry.

• "Fusarium_Wilt" — MARGINAL necrosis + wilting pattern:
  - Browning/yellowing starts from LEAF MARGINS and TIPS, progressing INWARD.
  - The pattern follows the leaf edge — NOT angular, NOT vein-bounded.
  - Affected tissue dries and becomes brittle, creating irregular brown borders along leaf edges.
  - Interveinal chlorosis (yellow between veins while veins stay green initially).
  - Leaf may droop or wilt even when soil is moist.
  - Often asymmetric — one side of the leaf or one half of the plant wilts first.
  - Stem cross-section would show brown vascular ring (not visible in leaf photos, but infer from overall wilt pattern).

CRITICAL DISTINCTION — Bacterial Blight vs Fusarium Wilt:
┌─────────────────┬──────────────────────────┬──────────────────────────┐
│ Feature         │ Bacterial Blight         │ Fusarium Wilt            │
├─────────────────┼──────────────────────────┼──────────────────────────┤
│ Lesion shape    │ ANGULAR (vein-bounded)   │ IRREGULAR (margin-first) │
│ Lesion location │ Scattered on leaf blade  │ Starts at leaf MARGINS   │
│ Yellow halo     │ YES, around each lesion  │ NO halo, general chlorosis│
│ Water-soaking   │ YES, translucent spots   │ NO, dry/brittle edges    │
│ Leaf wilting     │ Leaf stays flat          │ Leaf DROOPS and wilts    │
│ Progression     │ Spot → angular spread    │ Edge inward → whole leaf │
└─────────────────┴──────────────────────────┴──────────────────────────┘

STEP 4 — If none of the above → "Healthy"
Uniform green, no lesions, no curling, no marginal browning, no spots.

Now classify the image. Return ONLY the JSON object.`

// ─── Core: call one model (OpenRouter) ────────────────────────────────────────

async function callOpenRouterModel(
  model: string,
  imageDataUrl: string,
  apiKey: string
): Promise<{ ok: true; data: DetectionResult } | { ok: false; rateLimited: boolean; retryable: boolean; error: string }> {
  const payload = {
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: SYSTEM_PROMPT },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
    temperature: 0.05,
    max_tokens: 300,
  }

  let res: Response
  try {
    res = await fetch(OR_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://cot-dis.vercel.app",
        "X-Title": "Cotton Intelligence Pipeline",
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    return { ok: false, rateLimited: false, retryable: false, error: `Network error: ${String(err)}` }
  }

  if (res.status === 429) {
    return { ok: false, rateLimited: true, retryable: true, error: `${model} is rate-limited` }
  }

  if (!res.ok) {
    const text = await res.text()
    return { ok: false, rateLimited: false, retryable: false, error: `${model} returned ${res.status}: ${text.slice(0, 300)}` }
  }

  const json = await res.json()
  const textOutput: string | undefined = json?.choices?.[0]?.message?.content

  if (!textOutput) {
    return { ok: false, rateLimited: false, retryable: true, error: `${model} returned an empty response.` }
  }

  // ── Parse JSON with truncation recovery ────────────────────────────────────
  let parsed: DetectionResult
  try {
    const cleaned = textOutput
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim()
    parsed = JSON.parse(cleaned)
  } catch {
    // Try to recover truncated JSON — the model may have been cut off mid-"reasoning" string.
    // Strategy: find the last complete field before truncation and close the object.
    const recovered = tryRecoverTruncatedJSON(textOutput)
    if (recovered) {
      parsed = recovered
    } else {
      return {
        ok: false,
        rateLimited: false,
        retryable: true,  // retryable — next model may produce valid JSON
        error: `${model} response is not valid JSON: ${textOutput.slice(0, 200)}`,
      }
    }
  }

  // Validate + sanitise
  const validDiseases: DiseaseKey[] = ["Healthy", "Bacterial_Blight", "Fusarium_Wilt", "Curl_Virus"]
  if (parsed.disease !== null && !validDiseases.includes(parsed.disease as DiseaseKey)) {
    parsed.disease = null
    parsed.isCottonLeaf = false
  }
  parsed.confidence = Math.max(0, Math.min(100, Number(parsed.confidence) || 0))
  parsed.severity = Math.max(0, Math.min(100, Number(parsed.severity) || 0))
  parsed.reasoning = typeof parsed.reasoning === "string" ? parsed.reasoning.slice(0, 200) : ""
  parsed.modelUsed = model

  return { ok: true, data: parsed }
}

// ─── Core: call Gemini model ──────────────────────────────────────────────────

async function callGeminiModel(
  model: string,
  imageDataUrl: string,
  apiKey: string
): Promise<{ ok: true; data: DetectionResult } | { ok: false; retryable: boolean; error: string }> {
  const matches = imageDataUrl.match(/^data:(image\/\w+);base64,(.*)$/)
  if (!matches) {
    return { ok: false, retryable: false, error: "Invalid imageDataUrl format for Gemini." }
  }
  const mimeType = matches[1]
  const base64Data = matches[2]

  const client = new GoogleGenAI({ apiKey })

  let textOutput: string | undefined

  try {
    const response = await client.models.generateContent({
      model: model,
      config: {
        temperature: 0.05,
        responseMimeType: "application/json",
      },
      contents: [
        { text: SYSTEM_PROMPT },
        { inlineData: { mimeType, data: base64Data } }
      ]
    })

    textOutput = response.text
  } catch (err: any) {
    const status = err?.status || 500
    const msg = err?.message || String(err)
    return { ok: false, retryable: status === 429 || status >= 500, error: `Gemini SDK error: ${msg}` }
  }

  if (!textOutput) {
    return { ok: false, retryable: true, error: "Gemini returned an empty response." }
  }

  // ── Parse JSON with truncation recovery ────────────────────────────────────
  let parsed: DetectionResult
  try {
    const cleaned = textOutput
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim()
    parsed = JSON.parse(cleaned)
  } catch {
    const recovered = tryRecoverTruncatedJSON(textOutput)
    if (recovered) {
      parsed = recovered
    } else {
      return { ok: false, retryable: true, error: `Gemini response is not valid JSON: ${textOutput.slice(0, 200)}` }
    }
  }

  const validDiseases: DiseaseKey[] = ["Healthy", "Bacterial_Blight", "Fusarium_Wilt", "Curl_Virus"]
  if (parsed.disease !== null && !validDiseases.includes(parsed.disease as DiseaseKey)) {
    parsed.disease = null
    parsed.isCottonLeaf = false
  }
  parsed.confidence = Math.max(0, Math.min(100, Number(parsed.confidence) || 0))
  parsed.severity = Math.max(0, Math.min(100, Number(parsed.severity) || 0))
  parsed.reasoning = typeof parsed.reasoning === "string" ? parsed.reasoning.slice(0, 200) : ""
  parsed.modelUsed = model

  return { ok: true, data: parsed }
}

// ─── Truncated JSON recovery ──────────────────────────────────────────────────
//
// When a model gets cut off mid-output (hit token limit), the JSON is incomplete.
// Example: {"isCottonLeaf":true,"disease":"Fusarium_Wilt","confidence":85,"severity":40,"reasoning":"The leaf shows brown
// We try to salvage it by closing the string and object.

function tryRecoverTruncatedJSON(raw: string): DetectionResult | null {
  try {
    let text = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()

    // Must start with {
    if (!text.startsWith("{")) return null

    // If it doesn't end with }, try to close it
    if (!text.endsWith("}")) {
      // Close any open string
      const lastQuote = text.lastIndexOf('"')
      const lastColon = text.lastIndexOf(':')

      if (lastQuote > lastColon) {
        // We're inside a string value — close it and the object
        text = text + '"}'
      } else {
        // We're between fields — just close the object
        // Remove trailing comma if present
        text = text.replace(/,\s*$/, "") + "}"
      }
    }

    const obj = JSON.parse(text)

    // Verify we at least got disease and isCottonLeaf
    if (typeof obj.isCottonLeaf !== "boolean" || !obj.disease) return null

    return {
      isCottonLeaf: obj.isCottonLeaf,
      disease: obj.disease,
      confidence: obj.confidence ?? 70,
      severity: obj.severity ?? 30,
      reasoning: obj.reasoning ?? "(truncated response recovered)",
    }
  } catch {
    return null
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const geminiApiKey = process.env.GEMINI_API_KEY
  const openrouterApiKey = process.env.OPENROUTER_API_KEY

  if (!geminiApiKey && !openrouterApiKey) {
    return Response.json(
      { error: "Neither GEMINI_API_KEY nor OPENROUTER_API_KEY is configured. Add them to .env.local and restart the dev server." },
      { status: 500 }
    )
  }

  let body: { imageDataUrl: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const { imageDataUrl } = body
  if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
    return Response.json({ error: "imageDataUrl must be a base64 data URL." }, { status: 400 })
  }

  const errors: string[] = []

  // 1. Try Gemini first (Primary)
  if (geminiApiKey) {
    const geminiResult = await callGeminiModel("gemini-3-flash-preview", imageDataUrl, geminiApiKey)
    if (geminiResult.ok) {
      return Response.json(geminiResult.data)
    }
    errors.push(geminiResult.error)
    console.warn("Gemini model failed, falling back to OpenRouter:", geminiResult.error)
  }

  // 2. Try OpenRouter models (Fallback)
  if (openrouterApiKey) {
    for (const model of FALLBACK_MODELS) {
      const result = await callOpenRouterModel(model, imageDataUrl, openrouterApiKey)

      if (result.ok) {
        return Response.json(result.data)
      }

      errors.push(result.error)

      // Skip to next model on rate-limit OR retryable errors (bad JSON, empty response)
      if (result.rateLimited || result.retryable) {
        continue
      }

      // Non-retryable error — break early instead of returning immediately
      break
    }
  }

  // All models failed
  const allRateLimited = errors.length > 0 && errors.every(e => e.includes("rate-limited") || e.includes("429"))
  return Response.json(
    {
      error: allRateLimited
        ? "All vision models are currently rate-limited. Please wait 30 seconds and try again."
        : `All models failed. Last error: ${errors[errors.length - 1] || "Unknown error"}`,
      details: errors,
    },
    { status: allRateLimited ? 429 : 502 }
  )
}
