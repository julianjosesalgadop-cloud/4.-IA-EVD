"use client";

import React, { useState } from "react";
import { AlertTriangle, Plus, ShieldAlert, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";

export default function CriteriosPage() {
  const criterios = [
    { id: 1, rule: "Accidente con culpa en vía", action: "anular_evaluacion", apply_to: "Conductores", status: "activo" },
    { id: 2, name: "Prueba de alcoholemia positiva", action: "plan_mejoramiento_urgente", apply_to: "Todos", status: "activo" },
  ];

  const [sortField, setSortField] = useState<string>("rule");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedCriterios = [...criterios].sort((a, b) => {
    let valA: any = a[sortField as keyof typeof a];
    let valB: any = b[sortField as keyof typeof b];

    // Normalize property names (rule/name)
    if (sortField === "rule") {
      valA = (a.rule || a.name || "").toLowerCase();
      valB = (b.rule || b.name || "").toLowerCase();
    } else if (sortField === "apply_to") {
      valA = (a.apply_to || "").toLowerCase();
      valB = (b.apply_to || "").toLowerCase();
    } else if (sortField === "action") {
      valA = (a.action || "").toLowerCase();
      valB = (b.action || "").toLowerCase();
    } else if (sortField === "status") {
      valA = (a.status || "").toLowerCase();
      valB = (b.status || "").toLowerCase();
    }

    if (valA === undefined || valA === null) return 1;
    if (valB === undefined || valB === null) return -1;

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-brand-500" />
            Criterios Críticos (Reglas)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Define situaciones graves que anulan o afectan drásticamente la evaluación
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md">
          <Plus className="w-4 h-4" />
          Nuevo Criterio
        </button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/30 border-b">
            <tr>
              <th className="px-4 py-3 font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => handleSort("rule")}>
                <div className="flex items-center gap-1 hover:text-foreground transition-colors font-semibold">
                  Descripción de la Regla
                  {sortField === "rule" ? (
                    sortOrder === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-primary" /> : <ChevronDown className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-55" />
                  )}
                </div>
              </th>
              <th className="px-4 py-3 font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => handleSort("apply_to")}>
                <div className="flex items-center gap-1 hover:text-foreground transition-colors font-semibold">
                  Aplica a
                  {sortField === "apply_to" ? (
                    sortOrder === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-primary" /> : <ChevronDown className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-55" />
                  )}
                </div>
              </th>
              <th className="px-4 py-3 font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => handleSort("action")}>
                <div className="flex items-center gap-1 hover:text-foreground transition-colors font-semibold">
                  Acción Automática
                  {sortField === "action" ? (
                    sortOrder === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-primary" /> : <ChevronDown className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-55" />
                  )}
                </div>
              </th>
              <th className="px-4 py-3 font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => handleSort("status")}>
                <div className="flex items-center gap-1 hover:text-foreground transition-colors font-semibold">
                  Estado
                  {sortField === "status" ? (
                    sortOrder === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-primary" /> : <ChevronDown className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-55" />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedCriterios.map((c) => (
              <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-danger-500" />
                    {c.rule || c.name}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.apply_to}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-danger-100 text-danger-700 capitalize">
                    {c.action.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-success-100 text-success-700">
                    ACTIVO
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
