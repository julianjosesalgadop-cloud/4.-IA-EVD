"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { cn } from "@/lib/utils";
import { getCurrentUserProfile } from "@/app/actions/admin";
import { usePathname, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function checkRole() {
      try {
        const res = await getCurrentUserProfile();
        if (res?.data) {
          setUserProfile(res.data);
        }
      } catch (err) {
        console.error("Error checking role in layout:", err);
      } finally {
        setIsLoading(false);
      }
    }
    checkRole();
  }, []);

  const userRole = userProfile?.roles?.name;
  const isRestrictedPath = pathname.startsWith("/administracion") || 
                           pathname.startsWith("/configuracion") || 
                           pathname.startsWith("/auditoria") ||
                           (userRole === "colaborador" && (pathname.startsWith("/colaboradores") || pathname.startsWith("/evaluaciones")));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">Validando credenciales...</p>
      </div>
    );
  }

  if (isRestrictedPath && (userRole === "lider" || userRole === "colaborador")) {
    const sectionName = pathname.startsWith("/administracion") 
      ? "Administración" 
      : pathname.startsWith("/configuracion") 
        ? "Configuración" 
        : pathname.startsWith("/auditoria")
          ? "Auditoría"
          : pathname.startsWith("/colaboradores")
            ? "Colaboradores"
            : "Evaluaciones";

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-danger-200 dark:border-danger-900/30 p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-danger-100 dark:bg-danger-900/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-danger-600 dark:text-danger-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-danger-700 dark:text-danger-300">Acceso Restringido</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tu rol de <strong>{userProfile?.roles?.display_name || "Líder / Jefe"}</strong> no tiene permisos para visualizar ni editar la sección de <strong>{sectionName}</strong>.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 px-5 py-2.5 text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={userRole}
      />
      <Topbar
        collapsed={sidebarCollapsed}
        onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        title={title}
      />
      <main
        className={cn(
          "pt-14 min-h-screen transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "md:pl-[72px]" : "md:pl-[260px]"
        )}
      >
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
