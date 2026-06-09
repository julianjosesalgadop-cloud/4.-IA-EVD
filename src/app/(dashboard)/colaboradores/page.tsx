"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Search, Filter, Download, Upload,
  ChevronLeft, ChevronRight, Eye, Edit, MoreHorizontal,
  UserCheck, UserX, ArrowUpDown, Building2
} from "lucide-react";
import Link from "next/link";
import { cn, getStatusLabel, getInitials, formatDate, getContractTypeLabel } from "@/lib/utils";
import type { Collaborator } from "@/types";

import { getCollaborators } from "@/app/actions/collaborators";

const STATUS_COLORS: Record<string, string> = {
  activo: "text-success-600 bg-success-50 border-success-200 dark:bg-success-950/30",
  inactivo: "text-muted-foreground bg-muted border-border",
  retirado: "text-danger-600 bg-danger-50 border-danger-200 dark:bg-danger-950/30",
  vacaciones: "text-brand-600 bg-brand-50 border-brand-200 dark:bg-brand-950/30",
  incapacidad: "text-warning-600 bg-warning-50 border-warning-200 dark:bg-warning-950/30",
};

export default function ColaboradoresPage() {
  const [search, setSearch] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 10;

  const [collaborators, setCollaborators] = useState<Partial<Collaborator>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    async function fetchCollabs() {
      const res = await getCollaborators();
      if (!res.error && res.data) {
        // Formatear los nested joins
        const formatted = res.data.map((item: any) => ({
          ...item,
          area: item.areas ? { name: item.areas.name } : null,
          position: item.positions ? { name: item.positions.name } : null
        }));
        setCollaborators(formatted);
      }
      setIsLoading(false);
    }
    fetchCollabs();
  }, []);

  const filtered = collaborators.filter((c) => {
    const matchesSearch = !search ||
      c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.document_number?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchesArea = !selectedArea || c.area?.name === selectedArea;
    const matchesStatus = !selectedStatus || c.status === selectedStatus;
    return matchesSearch && matchesArea && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = {
    total: collaborators.length,
    activos: collaborators.filter(c => c.status === "activo").length,
    inactivos: collaborators.filter(c => c.status !== "activo").length,
  };

  return (
    <div className="w-full min-h-screen px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Colaboradores</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Gestión del personal de Flota Sugamuxi S.A.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          <Link href="/administracion/importar">
            <button className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border text-xs sm:text-sm font-medium hover:bg-accent transition-colors">
              <Upload className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              <span className="hidden sm:inline">Importar</span>
            </button>
          </Link>
          <button className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border text-xs sm:text-sm font-medium hover:bg-accent transition-colors">
            <Download className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <Link href="/colaboradores/nuevo">
            <button className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl gradient-brand text-white text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity shadow-md">
              <Plus className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              <span className="hidden sm:inline">Nuevo Colaborador</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Stats mini-cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Total", value: stats.total, icon: Users, color: "brand" },
          { label: "Activos", value: stats.activos, icon: UserCheck, color: "success" },
          { label: "Inactivos / Retirados", value: stats.inactivos, icon: UserX, color: "warning" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl border bg-card"
          >
            <div className={cn(
              "p-2 sm:p-2.5 rounded-lg flex-shrink-0",
              stat.color === "brand" ? "bg-brand-50 dark:bg-brand-950/30" :
              stat.color === "success" ? "bg-success-50 dark:bg-success-950/30" :
              "bg-warning-50 dark:bg-warning-950/30"
            )}>
              <stat.icon className={cn(
                "w-4 h-4",
                stat.color === "brand" ? "text-brand-500" :
                stat.color === "success" ? "text-success-600" :
                "text-warning-600"
              )} />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, documento o correo..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors",
            showFilters ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"
          )}
        >
          <Filter className="w-4 h-4" />
          Filtros
          {(selectedArea || selectedStatus) && (
            <span className="bg-primary-foreground/20 text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {[selectedArea, selectedStatus].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl border bg-muted/30">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Área</label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full h-9 rounded-lg border bg-background text-sm px-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Todas las áreas</option>
                  <option value="Operaciones">Operaciones</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Gestión Humana">Gestión Humana</option>
                  <option value="Comercial">Comercial</option>
                  <option value="Financiera">Financiera</option>
                  <option value="Tecnología">Tecnología</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Estado</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full h-9 rounded-lg border bg-background text-sm px-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Todos los estados</option>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="retirado">Retirado</option>
                  <option value="vacaciones">Vacaciones</option>
                  <option value="incapacidad">Incapacidad</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => { setSelectedArea(""); setSelectedStatus(""); }}
                  className="w-full h-9 rounded-lg border text-sm hover:bg-accent transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Colaborador <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                  Cargo
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Área <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                  Ingreso
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Estado
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex justify-center items-center gap-3">
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <p className="font-medium text-muted-foreground">Cargando colaboradores...</p>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">No se encontraron colaboradores</p>
                        <p className="text-sm text-muted-foreground">Ajusta los filtros o crea un nuevo colaborador</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((collab, i) => (
                  <motion.tr
                    key={collab.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Collaborator */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {getInitials(collab.full_name || "")}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{collab.full_name}</p>
                          <p className="text-xs text-muted-foreground">{collab.document_number}</p>
                        </div>
                      </div>
                    </td>
                    {/* Position */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm">{collab.position?.name}</p>
                      <p className="text-xs text-muted-foreground">{collab.email}</p>
                    </td>
                    {/* Area */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm">{collab.area?.name}</span>
                      </div>
                    </td>
                    {/* Hire Date */}
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                      {collab.hire_date ? formatDate(collab.hire_date) : "—"}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
                        STATUS_COLORS[collab.status ?? ""] ?? "text-muted-foreground bg-muted"
                      )}>
                        {getStatusLabel(collab.status ?? "")}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/colaboradores/${collab.id}`}>
                          <button className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Ver detalle">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        <Link href={`/colaboradores/${collab.id}/editar`}>
                          <button className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Editar">
                            <Edit className="w-4 h-4" />
                          </button>
                        </Link>
                        <button className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Más opciones">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
          <p className="text-sm text-muted-foreground">
            Mostrando {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} de {filtered.length} colaboradores
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                  page === p ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
      </div>
    </div>
  );
}
