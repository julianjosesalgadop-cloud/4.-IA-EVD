"use client";

import React, { useState } from "react";
import { AlertTriangle, Plus, ShieldAlert } from "lucide-react";

export default function CriteriosPage() {
  const criterios = [
    { id: 1, rule: "Accidente con culpa en vía", action: "anular_evaluacion", apply_to: "Conductores", status: "activo" },
    { id: 2, name: "Prueba de alcoholemia positiva", action: "plan_mejoramiento_urgente", apply_to: "Todos", status: "activo" },
  ];

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
              <th className="px-4 py-3 font-medium text-muted-foreground">Descripción de la Regla</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Aplica a</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Acción Automática</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {criterios.map((c) => (
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
