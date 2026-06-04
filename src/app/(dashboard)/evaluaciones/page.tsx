"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList, Plus, Search, Filter, Eye,
  Edit, FileDown, MoreHorizontal, ChevronLeft, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { cn, getResultLabel, getStatusLabel, formatDate, formatScore, getInitials } from "@/lib/utils";

import { getEvaluations } from "@/app/actions/evaluations";

const STATUS_STYLE: Record<string, string> = {
  borrador: "text-muted-foreground bg-muted border-border",
  en_proceso: "text-brand-600 bg-brand-50 border-brand-200 dark:bg-brand-950/30",
  finalizada: "text-success-600 bg-success-50 border-success-200 dark:bg-success-950/30",
  reabierta: "text-warning-600 bg-warning-50 border-warning-200 dark:bg-warning-950/30",
  anulada: "text-danger-600 bg-danger-50 border-danger-200 dark:bg-danger-950/30",
};

const RESULT_STYLE: Record<string, string> = {
  aprobado: "text-success-600 bg-success-50 border-success-200 dark:bg-success-950/30",
  plan_mejoramiento: "text-warning-600 bg-warning-50 border-warning-200 dark:bg-warning-950/30",
  no_aprobado: "text-danger-600 bg-danger-50 border-danger-200 dark:bg-danger-950/30",
  pendiente: "text-muted-foreground bg-muted border-border",
};

export default function EvaluacionesPage() {
  const [search, setSearch] = useState("");
  const [filterResult, setFilterResult] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    async function loadEvaluations() {
      const res = await getEvaluations();
      if (!res.error && res.data) {
        const mapped = res.data.map((e: any) => {
          const resObj = e.result && e.result.length > 0 ? e.result[0] : null;
          return {
            id: e.id,
            collaborator: e.collaborator?.full_name || "Desconocido",
            area: "—", // Mapped via position_id if needed
            position: "—",
            evaluator: e.evaluator ? `${e.evaluator.first_name} ${e.evaluator.last_name}` : "—",
            date: e.created_at,
            year: e.evaluation_year,
            status: e.status,
            result: resObj ? resObj.result_category : "pendiente",
            score: resObj ? resObj.overall_score : 0,
            has_pmi: resObj ? resObj.requires_pmi : false,
          };
        });
        setEvaluations(mapped);
      }
      setIsLoading(false);
    }
    loadEvaluations();
  }, []);

  const filtered = evaluations.filter((e) => {
    const matchSearch = !search || e.collaborator.toLowerCase().includes(search.toLowerCase());
    const matchResult = !filterResult || e.result === filterResult;
    const matchStatus = !filterStatus || e.status === filterStatus;
    return matchSearch && matchResult && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  // Summary stats
  const total = evaluations.length;
  const aprobados = evaluations.filter(e => e.result === "aprobado").length;
  const conPMI = evaluations.filter(e => e.has_pmi).length;
  const pendientes = evaluations.filter(e => e.status === "borrador" || e.status === "en_proceso").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Evaluaciones de Desempeño</h1>
          <p className="text-muted-foreground text-sm mt-1">Año 2026 · Flota Sugamuxi S.A.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm hover:bg-accent transition-colors">
            <FileDown className="w-4 h-4" />
            Exportar
          </button>
          <Link href="/evaluaciones/nueva">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md">
              <Plus className="w-4 h-4" />
              Nueva Evaluación
            </button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: total, color: "brand" },
          { label: "Aprobados", value: aprobados, color: "success" },
          { label: "Con PMI", value: conPMI, color: "warning" },
          { label: "Pendientes", value: pendientes, color: "violet" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="p-4 rounded-xl border bg-card text-center"
          >
            <p className={cn(
              "text-3xl font-bold",
              s.color === "success" ? "text-success-600" :
              s.color === "warning" ? "text-warning-600" :
              s.color === "violet" ? "text-violet-500" : "text-brand-500"
            )}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por colaborador..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 px-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="en_proceso">En proceso</option>
          <option value="finalizada">Finalizada</option>
          <option value="reabierta">Reabierta</option>
        </select>
        <select
          value={filterResult}
          onChange={(e) => setFilterResult(e.target.value)}
          className="h-10 px-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Todos los resultados</option>
          <option value="aprobado">Aprobado</option>
          <option value="plan_mejoramiento">Plan de Mejoramiento</option>
          <option value="no_aprobado">No Aprobado</option>
        </select>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border bg-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm data-table">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Colaborador</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Área / Cargo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Resultado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Promedio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Fecha</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex justify-center items-center gap-3">
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <p className="font-medium text-muted-foreground">Cargando evaluaciones...</p>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No se encontraron evaluaciones.
                  </td>
                </tr>
              ) : (
              paginated.map((ev, i) => (
                <motion.tr
                  key={ev.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {getInitials(ev.collaborator)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{ev.collaborator}</p>
                        <p className="text-xs text-muted-foreground">Año {ev.year}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-sm font-medium">{ev.position}</p>
                    <p className="text-xs text-muted-foreground">{ev.area}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border", STATUS_STYLE[ev.status])}>
                      {getStatusLabel(ev.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {ev.result !== "pendiente" && (
                      <div className="space-y-1">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border", RESULT_STYLE[ev.result])}>
                          {getResultLabel(ev.result)}
                        </span>
                        {ev.has_pmi && (
                          <div className="text-[10px] text-warning-600 font-semibold">PMI generado</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {ev.score > 0 ? (
                      <span className={cn(
                        "font-bold text-lg",
                        ev.score >= 4.0 ? "text-success-600" :
                        ev.score >= 3.1 ? "text-warning-600" : "text-danger-600"
                      )}>
                        {formatScore(ev.score)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                    {formatDate(ev.date)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Link href={`/evaluaciones/${ev.id}`}>
                        <button className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                          <Eye className="w-4 h-4" />
                        </button>
                      </Link>
                      {(ev.status === "borrador" || ev.status === "en_proceso") && (
                        <Link href={`/evaluaciones/${ev.id}/editar`}>
                          <button className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                            <Edit className="w-4 h-4" />
                          </button>
                        </Link>
                      )}
                      <button className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
          <p className="text-sm text-muted-foreground">
            {filtered.length} evaluaciones · Página {page} de {totalPages || 1}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-accent disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded-lg hover:bg-accent disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
