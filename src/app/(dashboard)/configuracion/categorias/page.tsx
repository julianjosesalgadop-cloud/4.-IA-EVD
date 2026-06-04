"use client";

import React, { useState } from "react";
import { FolderTree, Plus, Edit2, Trash2 } from "lucide-react";

export default function CategoriasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data for UI presentation
  const categorias = [
    { id: 1, name: "Competencias Corporativas", weight: "40%", description: "Competencias base que todos en la empresa deben cumplir" },
    { id: 2, name: "Competencias Específicas", weight: "40%", description: "Competencias propias del cargo o rol" },
    { id: 3, name: "Habilidades de Liderazgo", weight: "20%", description: "Exclusivo para coordinadores y jefes" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-brand-500" />
            Categorías de Evaluación
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Agrupa las preguntas por bloques temáticos y define sus pesos
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md"
        >
          <Plus className="w-4 h-4" />
          Nueva Categoría
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categorias.map((cat) => (
          <div key={cat.id} className="p-5 rounded-xl border bg-card hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">{cat.name}</h3>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 text-muted-foreground hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-muted-foreground hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary mb-4">
              Peso: {cat.weight}
            </div>
            
            <p className="text-sm text-muted-foreground">
              {cat.description}
            </p>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">Nueva Categoría</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nombre de la Categoría *</label>
                <input required className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Peso Sugerido (%)</label>
                <input type="number" className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Descripción</label>
                <textarea className="w-full min-h-[80px] rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 rounded-xl border text-sm font-medium hover:bg-muted transition-colors">
                  Cancelar
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
