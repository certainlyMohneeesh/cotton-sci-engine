import type { Metadata } from "next"
import { CottonPipelineShell } from "@/components/pipeline/pipeline-shell"

export const metadata: Metadata = {
  title: "Cotton Intelligence Pipeline · Disease → SCI → EIL",
  description:
    "4-stage cotton intelligence pipeline: AI disease detection, India-calibrated SCI degradation model, AGMARKNET market pricing, and EIL intervention decision.",
}

export default function PipelinePage() {
  return <CottonPipelineShell />
}
