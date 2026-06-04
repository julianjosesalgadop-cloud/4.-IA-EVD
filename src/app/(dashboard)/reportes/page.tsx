"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FileBarChart2, Download, FileSpreadsheet, FileText,
  Filter, TrendingUp, Users, Award, AlertTriangle
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, Legend
} from "recharts";
import { cn, formatScore } from "@/lib/utils";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const areaData = [
  { area: "Operaciones", promedio: 3.92, total: 68, aprobados: 48, pmi: 15, no_aprobados: 5 },
  { area: "Mantenimiento", promedio: 3.78, total: 42, aprobados: 28, pmi: 10, no_aprobados: 4 },
  { area: "G. Humana", promedio: 4.15, total: 12, aprobados: 10, pmi: 2, no_aprobados: 0 },
  { area: "Comercial", promedio: 3.65, total: 28, aprobados: 18, pmi: 7, no_aprobados: 3 },
  { area: "Financiera", promedio: 4.02, total: 18, aprobados: 14, pmi: 3, no_aprobados: 1 },
  { area: "Tecnología", promedio: 4.28, total: 8, aprobados: 7, pmi: 1, no_aprobados: 0 },
];

const categoryAverages = [
  { category: "Funciones", average: 3.95 },
  { category: "SST", average: 4.12 },
  { category: "Seg. Vial", average: 3.78 },
  { category: "Calidad", average: 3.91 },
  { category: "Equipo", average: 3.85 },
  { category: "Compromiso", average: 4.05 },
];

const contractDistribution = [
  { name: "Indefinido", value: 142, color: "#3b82f6" },
  { name: "Término Fijo", value: 58, color: "#8b5cf6" },
  { name: "Obra/Labor", value: 28, color: "#10b981" },
  { name: "Aprendizaje", value: 12, color: "#f59e0b" },
  { name: "Otros", value: 7, color: "#ef4444" },
];

const top10Best = [
  { name: "Rosa Suárez P.", area: "G. Humana", score: 4.85 },
  { name: "Luis Herrera C.", area: "Mantenimiento", score: 4.72 },
  { name: "Andrés Mora R.", area: "Tecnología", score: 4.68 },
  { name: "Diana Castro L.", area: "Financiera", score: 4.62 },
  { name: "Carlos Martínez", area: "Operaciones", score: 4.55 },
];

const criticalFails = [
  { collaborator: "Sandra Pérez M.", area: "Comercial", question: "SST-01 Uso de EPP", score: 2, min_required: 3 },
  { collaborator: "Jorge Torres V.", area: "Operaciones", question: "SV-03 No uso de celular", score: 1, min_required: 4 },
  { collaborator: "Pedro Álvarez C.", area: "Mantenimiento", question: "SST-02 Protocolos de seguridad", score: 2, min_required: 3 },
];

function exportToExcel() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Area Summary
  const ws1 = XLSX.utils.json_to_sheet(areaData.map(d => ({
    "Área": d.area,
    "Promedio": d.promedio,
    "Total Evaluados": d.total,
    "Aprobados": d.aprobados,
    "Plan de Mejora": d.pmi,
    "No Aprobados": d.no_aprobados,
  })));
  XLSX.utils.book_append_sheet(wb, ws1, "Por Área");

  // Sheet 2: Category Averages
  const ws2 = XLSX.utils.json_to_sheet(categoryAverages.map(d => ({
    "Categoría": d.category,
    "Promedio": d.average,
  })));
  XLSX.utils.book_append_sheet(wb, ws2, "Por Categoría");

  XLSX.writeFile(wb, "reporte_evd_2026.xlsx");
  toast.success("Reporte Excel exportado exitosamente");
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-enterprise text-sm">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: <strong>{typeof p.value === "number" && p.value <= 5 ? formatScore(p.value) : p.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function ReportesPage() {
  const [yearFilter, setYearFilter] = useState("2026");
  const [activeTab, setActiveTab] = useState<"resumen" | "areas" | "categorias" | "criticos" | "top">("resumen");

  const tabs = [
    { id: "resumen" as const, label: "Resumen General" },
    { id: "areas" as const, label: "Por Área" },
    { id: "categorias" as const, label: "Por Categoría" },
    { id: "criticos" as const, label: "Criterios Críticos" },
    { id: "top" as const, label: "Ranking" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes y Análisis</h1>
          <p className="text-muted-foreground text-sm mt-1">Inteligencia de Gestión del Desempeño</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="2026">Año 2026</option>
            <option value="2025">Año 2025</option>
          </select>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium hover:bg-accent transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-success-500" />
            Excel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium hover:bg-accent transition-colors">
            <FileText className="w-4 h-4 text-brand-500" />
            PDF
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Total evaluados", value: "198", sub: "de 247 colaboradores", color: "brand" },
          { icon: Award, label: "Tasa de aprobación", value: "71.7%", sub: "142 aprobados", color: "success" },
          { icon: TrendingUp, label: "Promedio general", value: "3.87", sub: "Sobre 5.0", color: "violet" },
          { icon: AlertTriangle, label: "Criterios críticos", value: "8", sub: "3 colaboradores", color: "danger" },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={cn(
              "p-4 rounded-xl border bg-card kpi-card-brand",
              `kpi-card-${kpi.color}`
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center mb-3",
              kpi.color === "brand" ? "bg-brand-50 dark:bg-brand-950/30" :
              kpi.color === "success" ? "bg-success-50 dark:bg-success-950/30" :
              kpi.color === "violet" ? "bg-violet-50 dark:bg-violet-950/30" :
              "bg-danger-50 dark:bg-danger-950/30"
            )}>
              <kpi.icon className={cn(
                "w-5 h-5",
                kpi.color === "brand" ? "text-brand-500" :
                kpi.color === "success" ? "text-success-600" :
                kpi.color === "violet" ? "text-violet-500" : "text-danger-500"
              )} />
            </div>
            <p className="text-2xl font-bold">{kpi.value}</p>
            <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-accent text-muted-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === "resumen" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Results Breakdown */}
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold mb-4">Distribución de Resultados</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={[
                    { name: "Aprobados", value: 142, color: "#10b981" },
                    { name: "Plan Mejora", value: 38, color: "#f59e0b" },
                    { name: "No Aprobados", value: 18, color: "#ef4444" },
                  ]} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {[{ color: "#10b981" }, { color: "#f59e0b" }, { color: "#ef4444" }].map((e, i) => (
                      <Cell key={i} fill={e.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} evaluaciones`, ""]} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Contract Distribution */}
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold mb-4">Colaboradores por Tipo de Contrato</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={contractDistribution} cx="50%" cy="50%" outerRadius={80} paddingAngle={2} dataKey="value">
                    {contractDistribution.map((e, i) => (
                      <Cell key={i} fill={e.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} colaboradores`, ""]} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "areas" && (
          <div className="space-y-6">
            {/* Area Bar Chart */}
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold mb-4">Promedio de Evaluaciones por Área</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={areaData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="area" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="promedio" name="Promedio" radius={[6, 6, 0, 0]}>
                    {areaData.map((d, i) => (
                      <Cell key={i} fill={d.promedio >= 4.0 ? "#10b981" : d.promedio >= 3.1 ? "#3b82f6" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Area Table */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm data-table">
                  <thead className="border-b bg-muted/30">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Área</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Evaluados</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Promedio</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Aprobados</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">PMI</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">No Aprobados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {areaData.map((d, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{d.area}</td>
                        <td className="px-4 py-3 text-right">{d.total}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn("font-bold", d.promedio >= 4.0 ? "text-success-600" : d.promedio >= 3.1 ? "text-warning-600" : "text-danger-600")}>
                            {formatScore(d.promedio)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-success-600 font-medium">{d.aprobados}</td>
                        <td className="px-4 py-3 text-right text-warning-600 font-medium">{d.pmi}</td>
                        <td className="px-4 py-3 text-right text-danger-600 font-medium">{d.no_aprobados}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "categorias" && (
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold mb-4">Promedio por Categoría de Evaluación</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryAverages} layout="vertical" barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="average" name="Promedio" radius={[0, 6, 6, 0]}>
                  {categoryAverages.map((d, i) => (
                    <Cell key={i} fill={d.average >= 4.0 ? "#10b981" : d.average >= 3.1 ? "#3b82f6" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === "criticos" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-danger-200 bg-danger-50 dark:bg-danger-950/20 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-danger-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-danger-700 dark:text-danger-400">Incumplimiento de criterios críticos</p>
                <p className="text-sm text-danger-600/80 dark:text-danger-400/80 mt-1">
                  Los siguientes colaboradores no alcanzaron la calificación mínima en criterios clasificados como críticos.
                  Se generó PMI automático para cada uno.
                </p>
              </div>
            </div>

            <div className="rounded-xl border bg-card overflow-hidden">
              <table className="w-full text-sm data-table">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Colaborador</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Área</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Criterio incumplido</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Calificación</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Mínimo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {criticalFails.map((cf, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold">{cf.collaborator}</td>
                      <td className="px-4 py-3 text-muted-foreground">{cf.area}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded mr-2">{cf.question.split(" ")[0]}</span>
                        {cf.question.split(" ").slice(1).join(" ")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-danger-600 font-bold text-lg">{cf.score}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-muted-foreground font-medium">{cf.min_required}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "top" && (
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold mb-4">Top 5 — Mejores Evaluaciones 2026</h3>
              <div className="space-y-3">
                {top10Best.map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                      i === 0 ? "bg-amber-100 text-amber-600 dark:bg-amber-950/30" :
                      i === 1 ? "bg-slate-100 text-slate-500 dark:bg-slate-900" :
                      i === 2 ? "bg-orange-100 text-orange-600 dark:bg-orange-950/30" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.area}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success-500 rounded-full"
                          style={{ width: `${(item.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-success-600 font-bold w-12 text-right">{formatScore(item.score)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
