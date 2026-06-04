"use client";

import React, { useState, useEffect } from "react";
import { Shield, Key, Check } from "lucide-react";
import { getRoles } from "@/app/actions/admin";

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRoles() {
      const { data } = await getRoles();
      setRoles(data || []);
      setIsLoading(false);
    }
    loadRoles();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-500" />
            Roles y Permisos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visualiza los niveles de acceso y permisos del sistema
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Cargando roles...</p>
          </div>
        ) : (
          roles.map((role) => (
            <div key={role.id} className="p-6 rounded-xl border bg-card hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{role.display_name}</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground uppercase">
                    {role.name}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                {role.description || "Sin descripción"}
              </p>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Permisos Principales</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {role.name === 'admin' && (
                    <div className="flex items-center gap-2 text-success-600 col-span-2">
                      <Check className="w-4 h-4" /> Acceso total al sistema
                    </div>
                  )}
                  {role.name !== 'admin' && (
                    <>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Check className="w-4 h-4 text-success-500" /> Ver Dashboard
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Check className="w-4 h-4 text-success-500" /> Mi Perfil
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
