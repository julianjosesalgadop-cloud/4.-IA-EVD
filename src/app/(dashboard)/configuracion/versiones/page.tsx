"use client";

import React, { useState } from "react";
import { FileCode2, Plus, Calendar, CheckCircle2, Copy } from "lucide-react";

export default function VersionesPage() {
  const versiones = [
    { id: 1, name: "EVD - Operativos 2024", status: "activa", questions: 15, date: "2024-01-15" },
    { id: 2, name: "EVD - Administrativos 2024", status: "activa", questions: 22, date: "2024-01-18" },
    { id: 3, name: "EVD 2023 (Legado)", status: "archivada", questions: 20, date: "2023-01-10" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileCode2 className="w-6 h-6 text-brand-500" />
            Versiones de Evaluación
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Administra los diferentes formatos y versiones aplicables
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md">
          <Plus className="w-4 h-4" />
          Nueva Versión
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {versiones.map((v) => (
          <div key={v.id} className={`p-5 rounded-xl border bg-card hover:shadow-md transition-all ${
            v.status === 'activa' ? 'border-l-4 border-l-success-500' : 'opacity-75'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg">{v.name}</h3>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                v.status === 'activa' ? 'bg-success-100 text-success-700' : 'bg-muted text-muted-foreground'
              }`}>
                {v.status}
              </span>
            </div>
            
            <div className="space-y-2 mb-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{v.questions} Preguntas asignadas</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Creada: {v.date}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">
                Editar
              </button>
              <button className="flex-1 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2">
                <Copy className="w-3.5 h-3.5" /> Clonar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
