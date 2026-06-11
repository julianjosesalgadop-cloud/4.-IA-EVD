"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList, RefreshCcw, Search, Filter,
  ChevronDown, Calendar, User, Database, ArrowUpCircle
} from "lucide-react";
import { getAuditLogs } from "@/app/actions/audit";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  action: string;
  table_name?: string;
  record_id?: string;
  description?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  created_at: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  crear:                 { label: "Crear",          color: "text-success-700 dark:text-success-400",  bg: "bg-success-100 dark:bg-success-950/40" },
  editar:                { label: "Editar",          color: "text-blue-700 dark:text-blue-400",        bg: "bg-blue-100 dark:bg-blue-950/40" },
  eliminar:              { label: "Eliminar",        color: "text-danger-700 dark:text-danger-400",    bg: "bg-danger-100 dark:bg-danger-950/40" },
  finalizar:             { label: "Finalizar",       color: "text-purple-700 dark:text-purple-400",    bg: "bg-purple-100 dark:bg-purple-950/40" },
  reabrir:               { label: "Reabrir",         color: "text-amber-700 dark:text-amber-400",      bg: "bg-amber-100 dark:bg-amber-950/40" },
  correo_enviado:        { label: "Correo Enviado",  color: "text-teal-700 dark:text-teal-400",        bg: "bg-teal-100 dark:bg-teal-950/40" },
  descarga_pdf:          { label: "Descarga PDF",    color: "text-indigo-700 dark:text-indigo-400",    bg: "bg-indigo-100 dark:bg-indigo-950/40" },
  descarga_excel:        { label: "Descarga Excel",  color: "text-emerald-700 dark:text-emerald-400",  bg: "bg-emerald-100 dark:bg-emerald-950/40" },
  cambio_configuracion:  { label: "Configuración",  color: "text-orange-700 dark:text-orange-400",    bg: "bg-orange-100 dark:bg-orange-950/40" },
  login:                 { label: "Login",           color: "text-sky-700 dark:text-sky-400",          bg: "bg-sky-100 dark:bg-sky-950/40" },
  logout:                { label: "Logout",          color: "text-slate-700 dark:text-slate-400",      bg: "bg-slate-100 dark:bg-slate-950/40" },
};

const TABLE_LABELS: Record<string, string> = {
  evaluations:        "Evaluaciones",
  collaborators:      "Colaboradores",
  profiles:           "Usuarios",
  areas:              "Áreas",
  positions:          "Cargos",
  roles:              "Roles",
  improvement_plans:  "PMI",
  evaluation_versions: "Versiones",
  companies:          "Empresa",
};

function formatDateTime(dateStr: string): { date: string; time: string } {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await getAuditLogs(500, {
        action: filterAction || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      if (error) throw new Error(error);
      setLogs((data as AuditLog[]) || []);
    } catch (err: any) {
      toast.error(err.message || "Error al cargar auditoría");
    } finally {
      setIsLoading(false);
    }
  }, [filterAction, dateFrom, dateTo]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filtered = logs.filter((log) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const userName = log.profile
      ? `${log.profile.first_name} ${log.profile.last_name} ${log.profile.email}`.toLowerCase()
      : "";
    const tableName = (log.table_name || "").toLowerCase();
    const desc = (log.description || "").toLowerCase();
    return userName.includes(term) || tableName.includes(term) || desc.includes(term);
  });

  function clearFilters() {
    setFilterAction("");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  }

  const hasActiveFilters = filterAction || dateFrom || dateTo;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-brand-500" />
            Auditoría del Sistema
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Registro de todas las acciones realizadas en la plataforma
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all",
              showFilters ? "bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-950/30 dark:border-brand-800" : "hover:bg-muted"
            )}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-brand-500" />
            )}
          </button>
          <button
            onClick={loadLogs}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCcw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-card text-center">
          <p className="text-2xl font-bold text-brand-600">{logs.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total registros</p>
        </div>
        <div className="p-4 rounded-xl border bg-card text-center">
          <p className="text-2xl font-bold text-success-600">
            {logs.filter((l) => l.action === "crear").length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Creaciones</p>
        </div>
        <div className="p-4 rounded-xl border bg-card text-center">
          <p className="text-2xl font-bold text-blue-600">
            {logs.filter((l) => l.action === "editar").length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Ediciones</p>
        </div>
        <div className="p-4 rounded-xl border bg-card text-center">
          <p className="text-2xl font-bold text-purple-600">
            {logs.filter((l) => l.action === "finalizar").length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Finalizaciones</p>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-xl border bg-card p-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo de Acción</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Todas las acciones</option>
                {Object.entries(ACTION_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Desde</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hasta</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={clearFilters}
              className="h-9 px-4 rounded-lg border text-sm font-medium hover:bg-muted transition-colors text-muted-foreground"
            >
              Limpiar filtros
            </button>
          </div>
        </motion.div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por usuario, tabla o descripción..."
          className="w-full h-10 pl-9 pr-4 text-sm rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Fecha / Hora</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Acción</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Usuario</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Tabla</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Descripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      Cargando registros de auditoría...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ClipboardList className="w-10 h-10 opacity-30" />
                      <p className="font-medium">No hay registros de auditoría</p>
                      {(search || hasActiveFilters) && (
                        <button onClick={clearFilters} className="text-sm text-brand-500 hover:underline">
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((log, idx) => {
                  const actionConf = ACTION_CONFIG[log.action] || {
                    label: log.action,
                    color: "text-muted-foreground",
                    bg: "bg-muted",
                  };
                  const { date, time } = formatDateTime(log.created_at);
                  const tableLabel = log.table_name
                    ? TABLE_LABELS[log.table_name] || log.table_name
                    : "—";

                  return (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.01 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">{date}</div>
                            <div className="text-xs">{time}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold",
                          actionConf.bg, actionConf.color
                        )}>
                          {actionConf.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {log.profile ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {log.profile.first_name?.charAt(0)}{log.profile.last_name?.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-xs">
                                {log.profile.first_name} {log.profile.last_name}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                {log.profile.email}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Sistema</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {log.table_name ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Database className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="text-xs font-medium">{tableLabel}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                          {log.description || (
                            <span className="italic opacity-50">Sin descripción</span>
                          )}
                        </p>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground flex items-center justify-between">
            <span>Mostrando {filtered.length} de {logs.length} registros</span>
            <span className="flex items-center gap-1">
              <ArrowUpCircle className="w-3.5 h-3.5" />
              Más recientes primero
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
