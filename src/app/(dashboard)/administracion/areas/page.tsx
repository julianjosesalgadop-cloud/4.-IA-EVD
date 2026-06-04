"use client";

import React, { useState, useEffect } from "react";
import { Building2, Plus, Search, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { getAreas, createArea } from "@/app/actions/config";
import { toast } from "sonner";

export default function AreasPage() {
  const [areas, setAreas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", code: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAreas();
  }, []);

  async function loadAreas() {
    setIsLoading(true);
    try {
      const data = await getAreas();
      setAreas(data || []);
    } catch (err) {
      toast.error("Error al cargar áreas");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await createArea(formData);
      if (result.error) throw new Error(result.error);
      
      toast.success("Área creada correctamente");
      setIsModalOpen(false);
      setFormData({ name: "", code: "", description: "" });
      loadAreas();
    } catch (err: any) {
      toast.error(err.message || "Error al crear el área");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-500" />
            Áreas y Dependencias
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Administra la estructura departamental de la empresa
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md"
        >
          <Plus className="w-4 h-4" />
          Nueva Área
        </button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/30 border-b">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">Código</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Nombre</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Descripción</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground">Cargando...</td>
              </tr>
            ) : areas.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground">No hay áreas registradas</td>
              </tr>
            ) : (
              areas.map((area) => (
                <tr key={area.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-muted-foreground">{area.code || "—"}</td>
                  <td className="px-4 py-3 font-semibold">{area.name}</td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-xs">{area.description || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-muted-foreground hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">Nueva Área</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nombre del Área *</label>
                <input 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Ej: Gestión Humana"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Código Interno</label>
                <input 
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Ej: GH-001"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Descripción</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full min-h-[80px] rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="Responsabilidades principales del área..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-xl border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? "Guardando..." : "Guardar Área"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
