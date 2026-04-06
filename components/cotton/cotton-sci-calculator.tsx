"use client"

import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DEFAULT_BASE_PROPERTIES,
  DEFAULT_CONTROLS,
  DISEASES,
  FACTOR_COLORS,
  FACTOR_NAMES,
  FACTOR_ORDER,
  FACTOR_SHORT_NAMES,
  getGinSpeedLabel,
  getPassesLabel,
  getSeverityLabel,
  PROPERTY_FORMATTERS,
  PROPERTY_KEYS,
  PROPERTY_NAMES,
  SCALE_TIERS,
  type CottonControls,
  type DiseaseKey,
  type FactorKey,
  type FiberVector,
  type PropertyKey,
  evaluateCottonModel,
} from "@/lib/cotton-sci"
import { cn } from "@/lib/utils"

type SliderRowProps = {
  name: string
  description: string
  value: number
  min: number
  max: number
  step: number
  displayValue: string
  accent?: string
  onChange: (value: number) => void
}

function SliderRow({
  name,
  description,
  value,
  min,
  max,
  step,
  displayValue,
  accent,
  onChange,
}: SliderRowProps) {
  return (
    <div className="grid grid-cols-1 gap-2 border-b border-border/80 py-3 last:border-b-0 md:grid-cols-[minmax(190px,1fr)_1fr_auto] md:items-center md:gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight text-foreground">{name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <div>
        <Slider
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={(values) => onChange(values[0] ?? value)}
        />
      </div>
      <span
        className="justify-self-end rounded-sm bg-muted px-2 py-1 text-right font-mono text-xs font-medium"
        style={{ color: accent ?? "var(--muted-foreground)" }}
      >
        {displayValue}
      </span>
    </div>
  )
}

function FactorBadge({ factor }: { factor: FactorKey }) {
  return (
    <Badge
      variant="outline"
      className="rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
      style={{
        borderColor: FACTOR_COLORS[factor],
        backgroundColor: `color-mix(in srgb, var(--card) 84%, ${FACTOR_COLORS[factor]} 16%)`,
        color: FACTOR_COLORS[factor],
      }}
    >
      Factor {factor.toUpperCase()}
    </Badge>
  )
}

function diseaseButtonBackground(disease: DiseaseKey): string {
  return `color-mix(in srgb, var(--card) 82%, ${DISEASES[disease].color} 18%)`
}

function gradeBadge(grade: { lbl: string; bg: string; clr: string }) {
  return (
    <span
      className="inline-flex rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
      style={{ backgroundColor: grade.bg, color: grade.clr }}
    >
      {grade.lbl}
    </span>
  )
}

function summaryTone(value: number): string {
  if (value < -15) return "#f87171"
  if (value < -5) return "#f59e0b"
  if (value > 5) return "#34d399"
  return "var(--foreground)"
}

export function CottonSciCalculator() {
  const [activeTab, setActiveTab] = useState<FactorKey>("dis")
  const [controls, setControls] = useState<CottonControls>(DEFAULT_CONTROLS)
  const [base, setBase] = useState<FiberVector>(DEFAULT_BASE_PROPERTIES)

  const model = useMemo(() => evaluateCottonModel(base, controls), [base, controls])

  const maxContribution = useMemo(
    () => Math.max(1, ...Object.values(model.factorContributions).map((value) => Math.abs(value))),
    [model.factorContributions]
  )

  const setControl = <K extends keyof CottonControls>(key: K, value: CottonControls[K]) => {
    setControls((previous) => ({ ...previous, [key]: value }))
  }

  const setBaseValue = (property: PropertyKey, value: number) => {
    setBase((previous) => ({ ...previous, [property]: value }))
  }

  const tabItems: Array<{ key: FactorKey; label: string }> = [
    { key: "dis", label: "A. Disease" },
    { key: "env", label: "B. Environment" },
    { key: "gen", label: "C. Genetics / Variety" },
    { key: "gin", label: "D. Ginning" },
    { key: "con", label: "E. Contamination" },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_10%,rgba(24,95,165,0.28),transparent_38%),radial-gradient(circle_at_88%_8%,rgba(153,53,86,0.24),transparent_42%),linear-gradient(180deg,#05070d_0%,#0b1020_62%,#0f1528_100%)] pb-8">
      <div className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:38px_38px]" />
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 md:px-8 md:pt-8">
        <header className="relative mb-6 grid gap-4 rounded-xl border border-border/60 bg-card/65 px-4 py-4 shadow-[0_8px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:px-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Nova SCI Dashboard</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Cotton quality simulation model
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Tune disease, environment, genetics, ginning, and contamination controls to estimate final SCI and
                property shifts.
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/50 px-4 py-3 text-right font-mono text-[11px] leading-relaxed text-muted-foreground">
              SCI = -414.67 + 2.9 * Str - 9.32 * Mic
              <br />+ 49.17 * Len(in) + 4.74 * UI + 0.65 * Rd + 0.36 * +b
            </div>
          </div>
        </header>

        <section className="mb-6 grid gap-3 md:grid-cols-3">
          <Card className="border-border/60 bg-card/70 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription>Healthy SCI</CardDescription>
              <CardTitle className="font-mono text-3xl font-semibold">{Math.round(model.healthySCI)}</CardTitle>
            </CardHeader>
            <CardContent>{gradeBadge(model.healthyGrade)}</CardContent>
          </Card>

          <Card className="border-border/60 bg-card/70 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription>Final SCI</CardDescription>
              <CardTitle className="font-mono text-3xl font-semibold" style={{ color: summaryTone(model.loss) }}>
                {Math.round(model.finalSCI)}
              </CardTitle>
            </CardHeader>
            <CardContent>{gradeBadge(model.finalGrade)}</CardContent>
          </Card>

          <Card className="border-border/60 bg-card/70 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription>Total SCI delta</CardDescription>
              <CardTitle className="font-mono text-3xl font-semibold" style={{ color: summaryTone(model.loss) }}>
                {model.loss >= 0 ? "+" : ""}
                {Math.round(model.loss)}
              </CardTitle>
            </CardHeader>
            <CardContent className="font-mono text-xs text-muted-foreground">
              {model.lossPercent >= 0 ? "+" : ""}
              {model.lossPercent.toFixed(1)}% vs healthy baseline
            </CardContent>
          </Card>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <Card className="border-border/60 bg-card/72 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Factor Controls</CardTitle>
                <CardDescription>Select a factor panel and tune severity inputs.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FactorKey)}>
                  <TabsList
                    variant="line"
                    className="h-auto w-full flex-wrap justify-start gap-1 rounded-none border-b border-border/70 bg-transparent p-0 pb-2"
                  >
                    {tabItems.map((item) => {
                      const selected = activeTab === item.key
                      return (
                        <TabsTrigger
                          key={item.key}
                          value={item.key}
                          className={cn(
                            "rounded-sm border border-border/70 bg-background/30 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.1em]",
                            selected && "data-active:border-current"
                          )}
                          style={{
                            color: selected ? FACTOR_COLORS[item.key] : undefined,
                            backgroundColor: selected
                              ? `color-mix(in srgb, var(--card) 82%, ${FACTOR_COLORS[item.key]} 18%)`
                              : undefined,
                          }}
                        >
                          <span
                            className="size-1.5 rounded-full"
                            style={{ backgroundColor: FACTOR_COLORS[item.key] }}
                            aria-hidden
                          />
                          {item.label}
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>

                  <TabsContent value="dis" className="pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Disease Detection</h3>
                      <FactorBadge factor="dis" />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(
                        ["Healthy", "Bacterial_Blight", "Fusarium_Wilt", "Curl_Virus"] as DiseaseKey[]
                      ).map((disease) => {
                        const selected = controls.disease === disease
                        const config = DISEASES[disease]
                        return (
                          <Button
                            key={disease}
                            variant="outline"
                            className={cn(
                              "h-auto items-start justify-start gap-1 rounded-sm px-3 py-2 text-left shadow-none",
                              selected && "border-2"
                            )}
                            style={
                              selected
                                ? {
                                    borderColor: config.color,
                                    backgroundColor: diseaseButtonBackground(disease),
                                  }
                                : {
                                    borderColor: "color-mix(in srgb, var(--border) 80%, transparent)",
                                    backgroundColor: "color-mix(in srgb, var(--card) 88%, transparent)",
                                  }
                            }
                            onClick={() => setControl("disease", disease)}
                          >
                            <span className="size-2 rounded-full" style={{ backgroundColor: config.color }} />
                            <span className="text-sm font-medium">{config.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {disease === "Healthy" && "No visible disease"}
                              {disease === "Bacterial_Blight" && "Angular spots"}
                              {disease === "Fusarium_Wilt" && "Yellowing and wilting"}
                              {disease === "Curl_Virus" && "Curling and deformation"}
                            </span>
                          </Button>
                        )
                      })}
                    </div>

                    {controls.disease !== "Healthy" ? (
                      <div className="mt-3">
                        <SliderRow
                          name="Severity"
                          description="Disease progression %"
                          value={controls.disSeverity}
                          min={0}
                          max={100}
                          step={1}
                          displayValue={`${controls.disSeverity}%`}
                          accent={FACTOR_COLORS.dis}
                          onChange={(value) => setControl("disSeverity", value)}
                        />
                      </div>
                    ) : null}
                  </TabsContent>

                  <TabsContent value="env" className="pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Environmental Conditions</h3>
                      <FactorBadge factor="env" />
                    </div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Rain and humidity
                    </p>
                    <SliderRow
                      name="Rain at boll opening"
                      description="Staining intensity"
                      value={controls.envRain}
                      min={0}
                      max={100}
                      step={1}
                      displayValue={getSeverityLabel(controls.envRain)}
                      accent={FACTOR_COLORS.env}
                      onChange={(value) => setControl("envRain", value)}
                    />
                    <SliderRow
                      name="Humidity exposure"
                      description="Microbial growth on fiber"
                      value={controls.envHumid}
                      min={0}
                      max={100}
                      step={1}
                      displayValue={getSeverityLabel(controls.envHumid)}
                      accent={FACTOR_COLORS.env}
                      onChange={(value) => setControl("envHumid", value)}
                    />

                    <p className="mt-4 mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Temperature stress
                    </p>
                    <SliderRow
                      name="Heat stress"
                      description="Shortens fibers, raises micronaire"
                      value={controls.envHeat}
                      min={0}
                      max={100}
                      step={1}
                      displayValue={getSeverityLabel(controls.envHeat)}
                      accent={FACTOR_COLORS.env}
                      onChange={(value) => setControl("envHeat", value)}
                    />
                    <SliderRow
                      name="Cold and frost stress"
                      description="Incomplete cellulose, lowers micronaire"
                      value={controls.envCold}
                      min={0}
                      max={100}
                      step={1}
                      displayValue={getSeverityLabel(controls.envCold)}
                      accent={FACTOR_COLORS.env}
                      onChange={(value) => setControl("envCold", value)}
                    />
                  </TabsContent>

                  <TabsContent value="gen" className="pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Genetic and Variety Selection</h3>
                      <FactorBadge factor="gen" />
                    </div>
                    <div className="rounded-sm border border-border/70 bg-background/35 px-3 py-2 text-xs text-muted-foreground">
                      Genetics controls most strength and a large share of length variance. Use variety tier and V x E
                      fit to apply baseline adjustments.
                    </div>

                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">Variety tier</p>
                      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                        <Select
                          value={controls.genVar.toString()}
                          onValueChange={(value) => setControl("genVar", Number.parseFloat(value))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select variety" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Mid-grade Upland (baseline)</SelectItem>
                            <SelectItem value="1">Premium ELS / Pima (long fiber)</SelectItem>
                            <SelectItem value="-1">Low-grade / short-staple</SelectItem>
                            <SelectItem value="0.5">Improved Bt hybrid (above avg)</SelectItem>
                            <SelectItem value="-0.5">Old unimproved variety (below avg)</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="rounded-sm bg-muted/70 px-2 py-1 font-mono text-xs font-medium text-emerald-300">
                          {controls.genVar >= 0 ? "+" : ""}
                          {controls.genVar.toFixed(1)}sigma
                        </span>
                      </div>
                    </div>

                    <div className="mt-2">
                      <SliderRow
                        name="Variety x environment fit"
                        description="Region suitability"
                        value={controls.genEnv}
                        min={-50}
                        max={50}
                        step={5}
                        displayValue={
                          controls.genEnv > 10 ? "+Favorable" : controls.genEnv < -10 ? "-Unfavorable" : "Neutral"
                        }
                        accent={FACTOR_COLORS.gen}
                        onChange={(value) => setControl("genEnv", value)}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="gin" className="pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Ginning and Processing</h3>
                      <FactorBadge factor="gin" />
                    </div>
                    <div className="rounded-sm border border-border/70 bg-background/35 px-3 py-2 text-xs text-muted-foreground">
                      Lint cleaning and low moisture raise mechanical damage risk. Aggressive speed can only reduce
                      quality.
                    </div>

                    <div className="mt-3">
                      <SliderRow
                        name="Lint cleaning passes"
                        description="0 = none, 3 = heavy cleaning"
                        value={controls.ginPasses}
                        min={0}
                        max={3}
                        step={1}
                        displayValue={getPassesLabel(controls.ginPasses)}
                        accent={FACTOR_COLORS.gin}
                        onChange={(value) => setControl("ginPasses", Math.round(value))}
                      />
                      <SliderRow
                        name="Moisture at ginning"
                        description="Ideal 6-8%; below 5% increases damage"
                        value={controls.ginMoist}
                        min={2}
                        max={10}
                        step={0.5}
                        displayValue={`${controls.ginMoist.toFixed(1)}%`}
                        accent={FACTOR_COLORS.gin}
                        onChange={(value) => setControl("ginMoist", value)}
                      />
                    </div>

                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium">Gin speed quality</p>
                      <Select
                        value={controls.ginSpeed.toString()}
                        onValueChange={(value) => setControl("ginSpeed", Number.parseInt(value, 10))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select speed quality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Optimal speed and settings</SelectItem>
                          <SelectItem value="1">Slightly aggressive</SelectItem>
                          <SelectItem value="2">Poor - over-ginned</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">{getGinSpeedLabel(controls.ginSpeed)}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="con" className="pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Contamination</h3>
                      <FactorBadge factor="con" />
                    </div>
                    <SliderRow
                      name="Trash and leaf content"
                      description="Inflates apparent micronaire"
                      value={controls.conTrash}
                      min={0}
                      max={100}
                      step={1}
                      displayValue={getSeverityLabel(controls.conTrash)}
                      accent={FACTOR_COLORS.con}
                      onChange={(value) => setControl("conTrash", value)}
                    />
                    <SliderRow
                      name="Sticky cotton"
                      description="Sugars from insects and disease"
                      value={controls.conSticky}
                      min={0}
                      max={100}
                      step={1}
                      displayValue={getSeverityLabel(controls.conSticky)}
                      accent={FACTOR_COLORS.con}
                      onChange={(value) => setControl("conSticky", value)}
                    />
                    <SliderRow
                      name="Soil, oil, and plastic"
                      description="Grade deduction and Rd loss"
                      value={controls.conSoil}
                      min={0}
                      max={100}
                      step={1}
                      displayValue={getSeverityLabel(controls.conSoil)}
                      accent={FACTOR_COLORS.con}
                      onChange={(value) => setControl("conSoil", value)}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/72 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Base Fiber Properties</CardTitle>
                <CardDescription>Healthy baseline used by the model.</CardDescription>
              </CardHeader>
              <CardContent>
                <SliderRow
                  name="Strength"
                  description="g/tex"
                  value={base.str}
                  min={18}
                  max={38}
                  step={0.5}
                  displayValue={base.str.toFixed(1)}
                  onChange={(value) => setBaseValue("str", value)}
                />
                <SliderRow
                  name="Micronaire"
                  description="Fineness and maturity"
                  value={base.mic}
                  min={2.5}
                  max={6.5}
                  step={0.1}
                  displayValue={base.mic.toFixed(1)}
                  onChange={(value) => setBaseValue("mic", value)}
                />
                <SliderRow
                  name="Length UHML"
                  description="inches"
                  value={base.len}
                  min={0.85}
                  max={1.35}
                  step={0.01}
                  displayValue={`${base.len.toFixed(2)}\"`}
                  onChange={(value) => setBaseValue("len", value)}
                />
                <SliderRow
                  name="Uniformity Index"
                  description="percent"
                  value={base.ui}
                  min={74}
                  max={88}
                  step={0.5}
                  displayValue={`${base.ui.toFixed(1)}%`}
                  onChange={(value) => setBaseValue("ui", value)}
                />
                <SliderRow
                  name="Reflectance Rd"
                  description="whiteness"
                  value={base.rd}
                  min={60}
                  max={85}
                  step={0.5}
                  displayValue={base.rd.toFixed(1)}
                  onChange={(value) => setBaseValue("rd", value)}
                />
                <SliderRow
                  name="Yellowness +b"
                  description="color tint"
                  value={base.yb}
                  min={6}
                  max={16}
                  step={0.5}
                  displayValue={base.yb.toFixed(1)}
                  onChange={(value) => setBaseValue("yb", value)}
                />
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-5">
            <Card className="border-border/60 bg-card/72 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Loss by Factor</CardTitle>
                <CardDescription>SCI change contribution from each factor.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {FACTOR_ORDER.map((factor) => {
                  const value = model.factorContributions[factor]
                  const width = Math.min(100, (Math.abs(value) / maxContribution) * 100)
                  return (
                    <div key={factor} className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ backgroundColor: FACTOR_COLORS[factor] }} />
                        <span className="text-xs font-medium text-foreground">{FACTOR_NAMES[factor]}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${width}%`,
                            backgroundColor: value < 0 ? FACTOR_COLORS[factor] : "#34d399",
                          }}
                        />
                      </div>
                      <span
                        className="font-mono text-xs"
                        style={{
                          color:
                            value < -2
                              ? FACTOR_COLORS[factor]
                              : value > 2
                                ? "#34d399"
                                : "var(--muted-foreground)",
                        }}
                      >
                        {value >= 0 ? "+" : ""}
                        {Math.round(value)}
                      </span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/72 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Final Property Values</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Property</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Healthy</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Final</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Delta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PROPERTY_KEYS.map((property) => {
                      const healthy = base[property]
                      const finalValue = model.finalProperties[property]
                      const changePercent = ((finalValue - healthy) / healthy) * 100
                      const isBad = property === "yb" || property === "mic" ? changePercent > 2 : changePercent < -2
                      const isGood = property === "yb" || property === "mic" ? changePercent < -2 : changePercent > 2
                      return (
                        <TableRow key={property}>
                          <TableCell className="text-xs font-medium">{PROPERTY_NAMES[property]}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {PROPERTY_FORMATTERS[property](healthy)}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-medium">
                            {PROPERTY_FORMATTERS[property](finalValue)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "font-mono text-xs",
                              isBad ? "text-rose-300" : isGood ? "text-emerald-300" : "text-muted-foreground"
                            )}
                          >
                            {changePercent >= 0 ? "+" : ""}
                            {changePercent.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                <div className="mt-4 grid grid-cols-5 gap-1.5">
                  {SCALE_TIERS.map((tier) => {
                    const active = model.finalGrade.lbl === tier.lbl
                    return (
                      <div key={tier.lbl} className="text-center">
                        <div
                          className={cn("mb-1 h-1 rounded-full", active && "ring-1 ring-foreground")}
                          style={{ backgroundColor: tier.clr, opacity: active ? 1 : 0.28 }}
                        />
                        <div className="text-[10px] uppercase" style={{ color: active ? tier.clr : "var(--muted-foreground)" }}>
                          {tier.lbl}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/72 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Factor x Property Impact Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  <div />
                  {PROPERTY_KEYS.map((property) => (
                    <div key={property} className="text-center text-[9px] font-semibold uppercase text-muted-foreground">
                      {PROPERTY_NAMES[property]}
                    </div>
                  ))}

                  {FACTOR_ORDER.map((factor) => (
                    <div key={factor} className="contents">
                      <div className="flex items-center text-[10px] font-semibold" style={{ color: FACTOR_COLORS[factor] }}>
                        {FACTOR_SHORT_NAMES[factor]}
                      </div>
                      {PROPERTY_KEYS.map((property) => {
                        const value = model.factorDeltas[factor][property] ?? 0
                        const intensity = Math.min(100, Math.abs(value) * 4)
                        const isBad = property === "yb" ? value > 0 : value < 0
                        let background = "var(--muted)"
                        let color = "var(--muted-foreground)"
                        let text = "-"

                        if (Math.abs(value) > 0.1) {
                          if (isBad) {
                              background = `rgba(248,113,113,${(intensity / 100) * 0.7 + 0.15})`
                          } else {
                              background = `rgba(52,211,153,${(intensity / 100) * 0.6 + 0.15})`
                          }
                            color = "#09111f"
                          text = `${value >= 0 ? "+" : ""}${value.toFixed(0)}%`
                        }

                        return (
                          <div
                            key={`${factor}-${property}`}
                            className="rounded-sm px-1 py-1 text-center font-mono text-[9px]"
                            style={{ backgroundColor: background, color }}
                          >
                            {text}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}