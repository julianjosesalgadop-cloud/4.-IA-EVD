"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Search, Edit2, Shield, Mail } from "lucide-react";
import { getProfiles } from "@/app/actions/admin";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

export default function UsuariosPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setIsLoading(true);
    try {
      const { data } = await getProfiles();
      setUsers(data || []);
    } catch (err) {
      toast.error("Error al cargar usuarios");
    } finally {
      setIsLoading(false);
    }
  }

  const filtered = users.filter(u => {
    const term = search.toLowerCase();
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    return fullName.includes(term) || u.email.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-500" />
            Usuarios del Sistema
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Administra los accesos y cuentas de la plataforma
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar usuario..."
              className="w-full h-10 pl-9 pr-4 text-sm rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md">
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Cargando usuarios...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-xl">
            <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">No se encontraron usuarios</p>
          </div>
        ) : (
          filtered.map((user) => (
            <div key={user.id} className="p-5 rounded-xl border bg-card hover:shadow-md transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-bl-full -z-10" />
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg">
                    {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.first_name} {user.last_name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <Shield className="w-3.5 h-3.5" />
                      <span className="capitalize">{user.roles?.display_name || "Sin Rol"}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                  user.active ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'
                }`}>
                  {user.active ? 'ACTIVO' : 'INACTIVO'}
                </span>
                
                <button className="p-1.5 text-muted-foreground hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
