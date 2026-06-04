"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users, ClipboardList, CheckCircle2, AlertCircle, TrendingUp,
  Clock, Target, BarChart3, Activity, AlertTriangle, ArrowUpRight,
  ArrowDownRight, Minus, Star, Eye
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";
import { cn, formatNumber, formatScore, getResultLabel, formatDate } from "@/lib/utils";
import Link from "next/link";
import { getDashboardStats } from "@/app/actions/dashboard";

// ---- Mock Data ----
// ---- Helper mapping function for KPIs ----
function buildKpiData(stats: any) {
  if (!stats) return [];
  return [
    { title: "Total Colaboradores", value: stats.totalCollabs, change: 0, icon: Users, color: "brand", suffix: "" },
    { title: "Evaluaciones Finalizadas", value: stats.completedEvals, change: 0, icon: ClipboardList, color: "violet", suffix: "" },
    { title: "Evaluaciones Aprobadas", value: stats.aprobados, change: 0, icon: CheckCircle2, color: "success", suffix: "" },
    { title: "Con Plan de Mejora", value: stats.conPMI, change: 0, icon: Target, color: "warning", suffix: "" },
    { title: "No Aprobados", value: stats.reprobados, change: 0, icon: AlertCircle, color: "danger", suffix: "" },
    { title: "PMI Activos", value: stats.pmisCount, change: 0, icon: Activity, color: "warning", suffix: "" },
    { title: "Promedio General", value: stats.avgScore, change: 0, icon: Star, color: "brand", suffix: "/5.0" },
  ];
}

// ---- KPI Card Component ----
function KPICard({ item, index }: { item: any; index: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = typeof item.value === "number" ? item.value : 0;
    const duration = 1200;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplayValue(target);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [item.value]);

  const isPositive = (item.change ?? 0) > 0;
  const isNeutral = item.change === 0;

  const colorMap = {
    brand: { icon: "text-brand-500", bg: "bg-brand-50 dark:bg-brand-950/30", bar: "#3b82f6" },
    violet: { icon: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30", bar: "#8b5cf6" },
    success: { icon: "text-success-500", bg: "bg-success-50 dark:bg-success-950/30", bar: "#10b981" },
    warning: { icon: "text-warning-600", bg: "bg-warning-50 dark:bg-warning-950/30", bar: "#f59e0b" },
    danger: { icon: "text-danger-500", bg: "bg-danger-50 dark:bg-danger-950/30", bar: "#ef4444" },
  };

  const colors = colorMap[item.color as keyof typeof colorMap];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className={cn(
        "kpi-card-brand rounded-xl p-5 cursor-default",
        `kpi-card-${item.color}`,
        "hover:shadow-card-hover transition-all duration-200"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-2.5 rounded-xl", colors.bg)}>
          <item.icon className={cn("w-5 h-5", colors.icon)} />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight">
            {item.color === "brand" && item.title.includes("Promedio")
              ? formatScore(displayValue)
              : formatNumber(Math.round(displayValue))
            }
          </span>
          {item.suffix && (
            <span className="text-sm text-muted-foreground">{item.suffix}</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground font-medium">{item.title}</p>
      </div>
    </motion.div>
  );
}

// ---- Alerts Panel ----
function AlertsPanel() {
  const alerts = [
    { type: "danger", message: "7 seguimientos PMI vencidos requieren atención", action: "/pmi" },
    { type: "warning", message: "18 colaboradores pendientes de evaluar en mayo", action: "/colaboradores" },
    { type: "warning", message: "Sandra Pérez - Evaluación no aprobada - PMI requerido", action: "/pmi/nuevo" },
    { type: "info", message: "Nueva versión de evaluación 2027 pendiente de configurar", action: "/configuracion/versiones" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-xl border bg-card p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning-500" />
          <h3 className="font-semibold">Alertas Pendientes</h3>
        </div>
        <span className="text-xs bg-danger-100 dark:bg-danger-950/30 text-danger-600 px-2 py-0.5 rounded-full font-semibold">
          {alerts.filter(a => a.type === "danger").length} críticas
        </span>
      </div>

      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <Link href={alert.action} key={i}>
            <div className={cn(
              "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
              alert.type === "danger" ? "bg-danger-50 dark:bg-danger-950/20 hover:bg-danger-100 dark:hover:bg-danger-950/30" :
              alert.type === "warning" ? "bg-warning-50 dark:bg-warning-950/20 hover:bg-warning-100 dark:hover:bg-warning-950/30" :
              "bg-brand-50 dark:bg-brand-950/20 hover:bg-brand-100 dark:hover:bg-brand-950/30"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                alert.type === "danger" ? "bg-danger-500" :
                alert.type === "warning" ? "bg-warning-500" : "bg-brand-500"
              )} />
              <p className="text-sm">{alert.message}</p>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

// ---- Recent Evaluations Table ----
function RecentEvaluations({ evaluations }: { evaluations: any[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-xl border bg-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Evaluaciones Recientes</h3>
        <Link href="/evaluaciones" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
          Ver todas <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm data-table">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-3 text-muted-foreground font-medium">Colaborador</th>
              <th className="pb-3 text-muted-foreground font-medium hidden md:table-cell">Cargo / Área</th>
              <th className="pb-3 text-muted-foreground font-medium">Resultado</th>
              <th className="pb-3 text-muted-foreground font-medium text-right">Promedio</th>
              <th className="pb-3 text-muted-foreground font-medium text-right">Fecha</th>
              <th className="pb-3 text-muted-foreground font-medium text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {evaluations.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-muted-foreground">
                  No hay evaluaciones recientes
                </td>
              </tr>
            ) : (
              evaluations.map((ev) => (
                <tr key={ev.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-3 font-medium">{ev.collaborator}</td>
                  <td className="py-3 hidden md:table-cell">
                    <div>
                      <p className="font-medium text-xs">{ev.position}</p>
                      <p className="text-muted-foreground text-xs">{ev.area}</p>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
                      ev.result === "aprobado" ? "text-success-600 bg-success-50 border-success-200 dark:bg-success-950/30" :
                      ev.result === "plan_mejoramiento" ? "text-warning-600 bg-warning-50 border-warning-200 dark:bg-warning-950/30" :
                      "text-danger-600 bg-danger-50 border-danger-200 dark:bg-danger-950/30"
                    )}>
                      {getResultLabel(ev.result)}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className={cn(
                      "font-bold text-base",
                      ev.score >= 4.0 ? "text-success-600" :
                      ev.score >= 3.1 ? "text-warning-600" : "text-danger-600"
                    )}>
                      {formatScore(ev.score)}
                    </span>
                  </td>
                  <td className="py-3 text-right text-muted-foreground text-xs">
                    {formatDate(ev.date)}
                  </td>
                  <td className="py-3 text-center">
                    <Link href={`/evaluaciones/${ev.id}`}>
                      <button className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                        <Eye className="w-4 h-4" />
                      </button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ---- Custom Tooltip ----
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-enterprise text-sm">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: <strong>{typeof p.value === "number" ? (p.value > 5 ? p.value : p.value.toFixed(2)) : p.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// ---- MAIN PAGE ----
export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function loadStats() {
      const data = await getDashboardStats();
      setStats(data);
    }
    loadStats();
  }, []);

  const kpiData = buildKpiData(stats?.kpis);

  const resultDistribution = stats ? [
    { name: "Aprobados", value: stats.kpis.aprobados, color: "#10b981" },
    { name: "Plan Mejora", value: stats.kpis.conPMI, color: "#f59e0b" },
    { name: "No Aprobados", value: stats.kpis.reprobados, color: "#ef4444" },
  ] : [];

  // Mocks that could be implemented dynamically later via DB grouping
  const areaAverageData = [
    { area: "Operaciones", promedio: 3.92, evaluados: 68 },
    { area: "Mantenimiento", promedio: 3.78, evaluados: 42 },
    { area: "G. Humana", promedio: 4.15, evaluados: 12 },
    { area: "Comercial", promedio: 3.65, evaluados: 28 },
    { area: "Financiera", promedio: 4.02, evaluados: 18 },
  ];
  
  const trendData = [
    { mes: "Ene", evaluaciones: 28, promedio: 3.72 },
    { mes: "Feb", evaluaciones: 35, promedio: 3.81 },
    { mes: "Mar", evaluaciones: 42, promedio: 3.85 },
    { mes: "Abr", evaluaciones: 38, promedio: 3.79 },
    { mes: "May", evaluaciones: stats?.kpis?.completedEvals || 5, promedio: stats?.kpis?.avgScore || 0 },
  ];
  
  const radarData = [
    { category: "Funciones", actual: 3.95, anterior: 3.72 },
    { category: "SST", actual: 4.12, anterior: 3.89 },
    { category: "Seg. Vial", actual: 3.78, anterior: 3.65 },
    { category: "Servicio", actual: 3.91, anterior: 3.80 },
    { category: "Equipo", actual: 3.85, anterior: 3.70 },
  ];

  if (!stats) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium">Cargando métricas ejecutivas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Ejecutivo</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Año 2026 · Actualizado hace 2 min
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="text-sm border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary/30 focus:outline-none">
            <option>Año 2026</option>
            <option>Año 2025</option>
          </select>
          <Link href="/evaluaciones/nueva">
            <button className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md">
              + Nueva Evaluación
            </button>
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {kpiData.map((item, i) => (
          <KPICard key={item.title} item={item} index={i} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Averages Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 rounded-xl border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold">Promedio por Área</h3>
              <p className="text-xs text-muted-foreground">Evaluaciones finalizadas 2026</p>
            </div>
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={areaAverageData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="area" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="promedio" name="Promedio" radius={[6, 6, 0, 0]}>
                {areaAverageData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.promedio >= 4.0 ? "#10b981" : entry.promedio >= 3.1 ? "#3b82f6" : "#ef4444"}
                  />
                ))}
              </Bar>
              {/* Threshold line at 4.0 */}
              <CartesianGrid y={4.0} strokeDasharray="4 4" stroke="#10b981" vertical={false} horizontal={false} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-success-500 inline-block" /> Aprobado (≥4.0)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-brand-500 inline-block" /> Plan Mejora (3.1–3.9)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-danger-500 inline-block" /> No Aprobado (&lt;3.1)</span>
          </div>
        </motion.div>

        {/* Result Distribution Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="rounded-xl border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold">Distribución</h3>
              <p className="text-xs text-muted-foreground">198 evaluaciones</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={resultDistribution}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {resultDistribution.map((entry, index) => (
                  <Cell key={index} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} evaluaciones`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {resultDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-muted-foreground text-xs">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs">{item.value}</span>
                  <span className="text-muted-foreground text-xs">
                    ({stats.kpis.completedEvals > 0 ? ((item.value / stats.kpis.completedEvals) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2 rounded-xl border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold">Tendencia 2026</h3>
              <p className="text-xs text-muted-foreground">Evolución de evaluaciones y promedio mensual</p>
            </div>
            <TrendingUp className="w-5 h-5 text-brand-500" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 5]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line yAxisId="left" type="monotone" dataKey="evaluaciones" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: "#3b82f6" }} name="Evaluaciones" activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="monotone" dataKey="promedio" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: "#8b5cf6" }} name="Promedio" activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="rounded-xl border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold">Competencias</h3>
              <p className="text-xs text-muted-foreground">2026 vs 2025</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
              <Radar name="2026" dataKey="actual" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
              <Radar name="2025" dataKey="anterior" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} strokeDasharray="4 4" />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentEvaluations evaluations={stats.recentEvals || []} />
        </div>
        <AlertsPanel />
      </div>
    </div>
  );
}
