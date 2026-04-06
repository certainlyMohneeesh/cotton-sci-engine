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
  FACTOR_BG_COLORS,
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
  onChange,
}: SliderRowProps) {
  return (
    <div className="grid grid-cols-1 gap-2 border-b border-border/70 py-3 last:border-b-0 md:grid-cols-[minmax(180px,1fr)_1fr_auto] md:items-center md:gap-3">
      <div>
        <p className="text-sm font-semibold">{name}</p>
        <p className="font-mono text-xs text-muted-foreground">{description}</p>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(values) => onChange(values[0] ?? value)}
      />
      <span className="justify-self-end font-mono text-xs font-medium text-muted-foreground">{displayValue}</span>
    </div>
  )
}

function factorBadge(factor: FactorKey) {
  return (
    <Badge
      variant="outline"
      className="font-mono uppercase tracking-wide"
      style={{
        borderColor: FACTOR_COLORS[factor],
        backgroundColor: FACTOR_BG_COLORS[factor],
        color: FACTOR_COLORS[factor],
      }}
    >
      Factor {factor.toUpperCase()}
    </Badge>
  )
}

function diseaseButtonBackground(disease: DiseaseKey): string {
  if (disease === "Healthy") return "#EAF3DE"
  if (disease === "Bacterial_Blight") return "#FBEEEC"
  if (disease === "Fusarium_Wilt") return "#FDF5E6"
  return "#F7EEF9"
}

function gradeBadge(grade: { lbl: string; bg: string; clr: string }) {
  return (
    <span
      className="inline-flex rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
      style={{ backgroundColor: grade.bg, color: grade.clr }}
    >
      {grade.lbl}
    </span>
  )
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
    <div className="mx-auto w-full max-w-[1160px] px-4 py-5 md:px-6 md:py-7">
      <header className="mb-5 grid gap-4 border-b border-foreground/20 pb-5 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <h1 className="font-heading text-3xl leading-tight tracking-tight text-foreground">
            Cotton Quality SCI Engine
          </h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-wide text-muted-foreground">
            5-factor model: disease + environment + genetics + ginning + contamination
          </p>
        </div>
        <div className="max-w-[360px] rounded-md bg-foreground px-3 py-2 text-right font-mono text-[10px] leading-relaxed text-background">
          SCI = -414.67 + 2.9*Str - 9.32*Mic
          <br />+ 49.17*Len(&quot;) + 4.74*UI + 0.65*Rd + 0.36*+b
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FactorKey)}>
            <TabsList
              variant="line"
              className="h-auto w-full flex-wrap justify-start gap-1 rounded-none border-b border-border bg-transparent p-0 pb-2"
            >
              {tabItems.map((item) => (
                <TabsTrigger
                  key={item.key}
                  value={item.key}
                  className="rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide"
                  style={{
                    borderColor: activeTab === item.key ? FACTOR_COLORS[item.key] : undefined,
                    backgroundColor: activeTab === item.key ? FACTOR_BG_COLORS[item.key] : undefined,
                    color: activeTab === item.key ? FACTOR_COLORS[item.key] : undefined,
                  }}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: FACTOR_COLORS[item.key] }}
                    aria-hidden
                  />
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="dis" className="pt-3">
              <Card>
                <CardHeader>
                  <CardTitle> Disease Detection </CardTitle>
                  <CardDescription>{factorBadge("dis")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                            "h-auto items-start justify-start gap-1 rounded-md px-3 py-2 text-left",
                            selected && "border-2"
                          )}
                          style={
                            selected
                              ? {
                                  borderColor: config.color,
                                  backgroundColor: diseaseButtonBackground(disease),
                                }
                              : undefined
                          }
                          onClick={() => setControl("disease", disease)}
                        >
                          <span className="size-2 rounded-full" style={{ backgroundColor: config.color }} />
                          <span className="text-sm font-semibold">{config.label}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">
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
                    <SliderRow
                      name="Severity"
                      description="Disease progression %"
                      value={controls.disSeverity}
                      min={0}
                      max={100}
                      step={1}
                      displayValue={`${controls.disSeverity}%`}
                      onChange={(value) => setControl("disSeverity", value)}
                    />
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="env" className="pt-3">
              <Card>
                <CardHeader>
                  <CardTitle> Environmental Conditions </CardTitle>
                  <CardDescription>{factorBadge("env")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#185FA5]">Rain / boll exposure</p>
                  <SliderRow
                    name="Rain at boll opening"
                    description="Staining intensity"
                    value={controls.envRain}
                    min={0}
                    max={100}
                    step={1}
                    displayValue={getSeverityLabel(controls.envRain)}
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
                    onChange={(value) => setControl("envHumid", value)}
                  />

                  <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-[#7A4A06]">Temperature stress</p>
                  <SliderRow
                    name="Heat stress"
                    description="Shortens fibers, raises micronaire"
                    value={controls.envHeat}
                    min={0}
                    max={100}
                    step={1}
                    displayValue={getSeverityLabel(controls.envHeat)}
                    onChange={(value) => setControl("envHeat", value)}
                  />
                  <SliderRow
                    name="Cold / frost stress"
                    description="Incomplete cellulose, lowers micronaire"
                    value={controls.envCold}
                    min={0}
                    max={100}
                    step={1}
                    displayValue={getSeverityLabel(controls.envCold)}
                    onChange={(value) => setControl("envCold", value)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gen" className="pt-3">
              <Card>
                <CardHeader>
                  <CardTitle> Genetic / Variety Selection </CardTitle>
                  <CardDescription>{factorBadge("gen")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                    Genetics controls most of the strength and a large share of length variance. Use variety tier
                    and variety-environment fit to apply baseline genetic adjustments.
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Variety tier</p>
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
                      <span className="font-mono text-xs font-semibold text-[#3B6D11]">
                        {controls.genVar >= 0 ? "+" : ""}
                        {controls.genVar.toFixed(1)}sigma
                      </span>
                    </div>
                  </div>

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
                    onChange={(value) => setControl("genEnv", value)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gin" className="pt-3">
              <Card>
                <CardHeader>
                  <CardTitle> Ginning and Processing </CardTitle>
                  <CardDescription>{factorBadge("gin")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                    Lint cleaning and low moisture raise mechanical damage risk. Aggressive speed can only reduce
                    quality, never improve it.
                  </div>

                  <SliderRow
                    name="Lint cleaning passes"
                    description="0 = none, 3 = heavy cleaning"
                    value={controls.ginPasses}
                    min={0}
                    max={3}
                    step={1}
                    displayValue={getPassesLabel(controls.ginPasses)}
                    onChange={(value) => setControl("ginPasses", Math.round(value))}
                  />
                  <SliderRow
                    name="Moisture at ginning"
                    description="Ideal: 6-8%; below 5% = damage"
                    value={controls.ginMoist}
                    min={2}
                    max={10}
                    step={0.5}
                    displayValue={`${controls.ginMoist.toFixed(1)}%`}
                    onChange={(value) => setControl("ginMoist", value)}
                  />

                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Gin speed quality</p>
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
                    <p className="font-mono text-xs text-muted-foreground">{getGinSpeedLabel(controls.ginSpeed)}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="con" className="pt-3">
              <Card>
                <CardHeader>
                  <CardTitle> Contamination </CardTitle>
                  <CardDescription>{factorBadge("con")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <SliderRow
                    name="Trash / leaf content"
                    description="Inflates apparent micronaire"
                    value={controls.conTrash}
                    min={0}
                    max={100}
                    step={1}
                    displayValue={getSeverityLabel(controls.conTrash)}
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
                    onChange={(value) => setControl("conSticky", value)}
                  />
                  <SliderRow
                    name="Soil / oil / plastic"
                    description="Grade deduction and Rd loss"
                    value={controls.conSoil}
                    min={0}
                    max={100}
                    step={1}
                    displayValue={getSeverityLabel(controls.conSoil)}
                    onChange={(value) => setControl("conSoil", value)}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle> Base Fiber Properties (Healthy Baseline) </CardTitle>
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
                description="Fineness + maturity"
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
                description="%"
                value={base.ui}
                min={74}
                max={88}
                step={0.5}
                displayValue={`${base.ui.toFixed(1)}%`}
                onChange={(value) => setBaseValue("ui", value)}
              />
              <SliderRow
                name="Reflectance Rd"
                description="Whiteness %"
                value={base.rd}
                min={60}
                max={85}
                step={0.5}
                displayValue={base.rd.toFixed(1)}
                onChange={(value) => setBaseValue("rd", value)}
              />
              <SliderRow
                name="Yellowness +b"
                description="Color tint"
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

        <aside className="space-y-4">
          <Card className="bg-[#1A1714] text-[#F5F0E8]">
            <CardHeader>
              <CardTitle className="font-heading text-xl">SCI Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#F5F0E8]/50">Healthy SCI</p>
                  <p className="font-heading text-4xl leading-none">{Math.round(model.healthySCI)}</p>
                  <div className="mt-2">{gradeBadge(model.healthyGrade)}</div>
                </div>
                <div className="w-px bg-white/20" aria-hidden />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#F5F0E8]/50">Final SCI</p>
                  <p className="font-heading text-4xl leading-none text-[#F5A623]">{Math.round(model.finalSCI)}</p>
                  <div className="mt-2">{gradeBadge(model.finalGrade)}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#F5F0E8]/50">Total SCI Loss</span>
                <span
                  className="font-mono text-sm font-medium"
                  style={{
                    color:
                      model.loss < -10
                        ? "#F5A623"
                        : model.loss < 0
                          ? "#E8C870"
                          : "rgba(255,255,255,0.7)",
                  }}
                >
                  {model.loss >= 0 ? "+" : ""}
                  {Math.round(model.loss)} ({model.loss >= 0 ? "+" : ""}
                  {model.lossPercent.toFixed(1)}%)
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle> Loss by Factor </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {FACTOR_ORDER.map((factor) => {
                const value = model.factorContributions[factor]
                const width = Math.min(100, (Math.abs(value) / maxContribution) * 100)
                return (
                  <div key={factor} className="grid grid-cols-[auto_minmax(72px,1fr)_1fr_auto] items-center gap-2">
                    <span className="size-2 rounded-full" style={{ backgroundColor: FACTOR_COLORS[factor] }} />
                    <span
                      className="text-xs font-semibold"
                      style={{ color: value < -2 ? FACTOR_COLORS[factor] : "var(--muted-foreground)" }}
                    >
                      {FACTOR_NAMES[factor]}
                    </span>
                    <div className="h-1.5 overflow-hidden rounded-sm bg-muted">
                      <div
                        className="h-full rounded-sm"
                        style={{
                          width: `${width}%`,
                          backgroundColor: value < 0 ? FACTOR_COLORS[factor] : "#3B6D11",
                        }}
                      />
                    </div>
                    <span
                      className="font-mono text-xs"
                      style={{
                        color:
                          value < -2 ? FACTOR_COLORS[factor] : value > 2 ? "#3B6D11" : "var(--muted-foreground)",
                      }}
                    >
                      {value >= 0 ? "+" : ""}
                      {Math.round(value)} SCI
                    </span>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle> Final Property Values </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                      Property
                    </TableHead>
                    <TableHead className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                      Healthy
                    </TableHead>
                    <TableHead className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                      Final
                    </TableHead>
                    <TableHead className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                      Delta
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PROPERTY_KEYS.map((property) => {
                    const healthy = base[property]
                    const finalValue = model.finalProperties[property]
                    const changePercent = ((finalValue - healthy) / healthy) * 100
                    const isBad = (property === "yb" || property === "mic") ? changePercent > 2 : changePercent < -2
                    const isGood = (property === "yb" || property === "mic") ? changePercent < -2 : changePercent > 2
                    return (
                      <TableRow key={property}>
                        <TableCell className="text-xs font-semibold">{PROPERTY_NAMES[property]}</TableCell>
                        <TableCell className="font-mono text-xs">{PROPERTY_FORMATTERS[property](healthy)}</TableCell>
                        <TableCell className="font-mono text-xs font-medium">
                          {PROPERTY_FORMATTERS[property](finalValue)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "font-mono text-xs",
                            isBad ? "text-red-700" : isGood ? "text-green-700" : "text-muted-foreground"
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

              <div className="mt-4 grid grid-cols-5 gap-1">
                {SCALE_TIERS.map((tier) => {
                  const active = model.finalGrade.lbl === tier.lbl
                  return (
                    <div key={tier.lbl} className="text-center">
                      <div
                        className={cn("mb-1 h-1 rounded-xs", active && "ring-2 ring-foreground")}
                        style={{ backgroundColor: tier.clr, opacity: active ? 1 : 0.3 }}
                      />
                      <div
                        className="font-mono text-[10px] uppercase"
                        style={{ color: active ? tier.clr : "var(--muted-foreground)" }}
                      >
                        {tier.lbl}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle> Factor x Property Impact Map </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                <div />
                {PROPERTY_KEYS.map((property) => (
                  <div
                    key={property}
                    className="text-center font-mono text-[9px] font-bold uppercase tracking-wide text-muted-foreground"
                  >
                    {PROPERTY_NAMES[property]}
                  </div>
                ))}

                {FACTOR_ORDER.map((factor) => (
                  <div key={factor} className="contents">
                    <div
                      className="flex items-center text-[10px] font-bold"
                      style={{ color: FACTOR_COLORS[factor] }}
                    >
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
                          background = `rgba(192,57,43,${(intensity / 100) * 0.7 + 0.1})`
                        } else {
                          background = `rgba(45,80,22,${(intensity / 100) * 0.6 + 0.1})`
                        }
                        color = "#fff"
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
  )
}