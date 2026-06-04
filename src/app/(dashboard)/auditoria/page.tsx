"use client";

import React, { useState, useEffect } from "react";
import { Shield, Search, Calendar, User, Activity, Clock } from "lucide-react";
import { getAuditLogs } from "@/app/actions/audit";
import { formatDate } from "@/lib/utils";

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadLogs() {
      const { data } = await getAuditLogs(200);
      setLogs(data || []);
      setIsLoading(false);
    }
    loadLogs();
  }, []);

  const filtered = logs.filter(log => {
    const term = search.toLowerCase();
    const user = `${log.profile?.first_name} ${log.profile?.last_name}`.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.entity_type.toLowerCase().includes(term) ||
      user.includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-500" />
            Auditoría del Sistema
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Registro inmutable de actividades y eventos críticos
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar evento, usuario..."
            className="w-full h-10 pl-9 pr-4 text-sm rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-muted-foreground">Fecha y Hora</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Usuario</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Acción</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Módulo</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Cargando registros...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No se encontraron registros
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-600 flex items-center justify-center font-bold text-xs">
                          {log.profile?.first_name?.charAt(0)}{log.profile?.last_name?.charAt(0)}
                        </div>
                        <span className="font-medium">{log.profile?.first_name} {log.profile?.last_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 capitalize">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize">{log.entity_type}</td>
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-xs">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
