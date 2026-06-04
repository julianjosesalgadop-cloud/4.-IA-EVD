"use client";

import React from "react";
import { FileBarChart2, Download, FileSpreadsheet, FileText, Filter, TrendingUp } from "lucide-react";

export default function ReportesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileBarChart2 className="w-6 h-6 text-brand-500" />
            Reportes y Estadísticas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Genera informes consolidados de desempeño y expórtalos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Consolidado */}
        <div className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="w-24 h-24" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-success-50 dark:bg-success-950/30 flex items-center justify-center mb-4 text-success-600">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-2">Consolidado General (Excel)</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Descarga la matriz completa con todos los colaboradores, calificaciones por pregunta y promedios finales.
          </p>
          <button className="flex items-center gap-2 text-sm font-semibold text-success-600 hover:text-success-700">
            <Download className="w-4 h-4" />
            Generar Reporte
          </button>
        </div>

        {/* Planes de Mejoramiento */}
        <div className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-24 h-24" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-warning-50 dark:bg-warning-950/30 flex items-center justify-center mb-4 text-warning-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-2">Seguimiento PMI</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Reporte de todos los planes de mejora activos, compromisos y estado de los seguimientos a 30/60/90 días.
          </p>
          <button className="flex items-center gap-2 text-sm font-semibold text-warning-600 hover:text-warning-700">
            <Download className="w-4 h-4" />
            Generar Reporte
          </button>
        </div>

        {/* Resumen Ejecutivo */}
        <div className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
            <FileText className="w-24 h-24" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center mb-4 text-brand-600">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-2">Resumen Ejecutivo (PDF)</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Documento gerencial con gráficos de radar por área, distribución de resultados y métricas clave.
          </p>
          <button className="flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
            <Download className="w-4 h-4" />
            Generar Reporte
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold">Filtros de Exportación Personalizada</h3>
          <button className="p-2 rounded-lg bg-muted hover:bg-accent transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Área</label>
            <select className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Todas las áreas</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Resultado</label>
            <select className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Todos</option>
              <option value="aprobado">Aprobado</option>
              <option value="plan_mejoramiento">Plan de Mejoramiento</option>
              <option value="no_aprobado">No Aprobado</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Fecha Inicio</label>
            <input type="date" className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="space-y-1.5 flex items-end">
            <button className="w-full h-10 rounded-lg gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity">
              Buscar Datos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
