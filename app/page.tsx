import Link from "next/link"
import { CottonSciCalculator } from "@/components/cotton/cotton-sci-calculator"

export default function Home() {
  return (
    <>
      <div className="flex justify-end px-4 py-2 md:px-8">
        <Link
          href="/pipeline"
          className="inline-flex items-center gap-2 rounded border border-border/60 bg-card/60 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground backdrop-blur transition-all hover:border-foreground/50 hover:text-foreground"
        >
          <span className="size-1.5 rounded-full bg-[#8FCE5A]" />
          Open Intelligence Pipeline →
        </Link>
      </div>
      <CottonSciCalculator />
    </>
  )
}
