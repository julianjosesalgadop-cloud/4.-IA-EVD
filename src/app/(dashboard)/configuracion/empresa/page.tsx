"use client";

import React, { useState, useEffect } from "react";
import { Building2, Save, Upload, MapPin, Phone, Mail } from "lucide-react";
import { getCompany } from "@/app/actions/admin";
import { toast } from "sonner";

export default function EmpresaPage() {
  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadCompany() {
      const { data } = await getCompany();
      setCompany(data || {});
      setIsLoading(false);
    }
    loadCompany();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // TODO: implement update logic in server action
    setTimeout(() => {
      toast.success("Datos de la empresa actualizados");
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="w-6 h-6 text-brand-500" />
          Perfil de Empresa
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Actualiza los datos corporativos, NIT y logotipo
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-4" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 rounded-xl border bg-card flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-32 h-32 rounded-xl border-2 border-dashed bg-muted/30 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 hover:border-brand-500 transition-colors cursor-pointer group">
              <Upload className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">Subir Logo</span>
            </div>
            
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium">Nombre de la Empresa *</label>
                <input 
                  defaultValue={company?.name}
                  required
                  className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">NIT / Identificación Financiera</label>
                <input 
                  defaultValue={company?.nit}
                  className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">País</label>
                <input 
                  defaultValue={company?.country || 'Colombia'}
                  className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border bg-card space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-brand-500" />
              Datos de Contacto
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium">Dirección Principal</label>
                <input 
                  defaultValue={company?.address}
                  className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Ciudad</label>
                <input 
                  defaultValue={company?.city}
                  className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Teléfono de Contacto</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    defaultValue={company?.phone}
                    className="w-full h-10 pl-9 pr-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Correo de Soporte / RRHH</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="email"
                    defaultValue={company?.email}
                    className="w-full h-10 pl-9 pr-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
