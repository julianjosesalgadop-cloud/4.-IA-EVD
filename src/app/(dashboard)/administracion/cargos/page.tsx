"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Plus, Edit2, Trash2 } from "lucide-react";
import { getPositions, getAreas, createPosition } from "@/app/actions/config";
import { toast } from "sonner";

export default function CargosPage() {
  const [positions, setPositions] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", code: "", description: "", area_id: "", level: 1 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [posData, areasData] = await Promise.all([
        getPositions(),
        getAreas()
      ]);
      setPositions(posData || []);
      setAreas(areasData || []);
    } catch (err) {
      toast.error("Error al cargar datos");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await createPosition(formData);
      if (result.error) throw new Error(result.error);
      
      toast.success("Cargo creado correctamente");
      setIsModalOpen(false);
      setFormData({ name: "", code: "", description: "", area_id: "", level: 1 });
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Error al crear el cargo");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-500" />
            Cargos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Administra los roles y niveles jerárquicos de la empresa
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cargo
        </button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/30 border-b">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">Código</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Nombre del Cargo</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Área</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Nivel</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">Cargando...</td>
              </tr>
            ) : positions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">No hay cargos registrados</td>
              </tr>
            ) : (
              positions.map((pos) => (
                <tr key={pos.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-muted-foreground">{pos.code || "—"}</td>
                  <td className="px-4 py-3 font-semibold">{pos.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{pos.areas?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
                      {pos.level}
                    </span>
                  </td>
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
              <h3 className="font-bold text-lg">Nuevo Cargo</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nombre del Cargo *</label>
                <input 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Ej: Analista de Nómina"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Código</label>
                  <input 
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Ej: NOM-01"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Nivel Jerárquico *</label>
                  <input 
                    type="number"
                    min="1"
                    required
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})}
                    className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Área Perteneciente</label>
                <select 
                  value={formData.area_id}
                  onChange={(e) => setFormData({...formData, area_id: e.target.value})}
                  className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Seleccionar área...</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
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
                  {isSubmitting ? "Guardando..." : "Guardar Cargo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
