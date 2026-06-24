"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
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

  // Inactivity timeout: 15 minutes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          console.log("Inactividad detectada. Cerrando sesión...");
          const { logoutAction } = await import("@/app/actions/auth");
          await logoutAction();
          // Force client-side redirect to login
          window.location.href = "/login";
        } catch (err) {
          console.error("Error al cerrar sesión por inactividad:", err);
        }
      }, 15 * 60 * 1000); // 15 minutes
    };

    // Events to track user activity
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];

    // Initialize timer
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  useEffect(() => {
    async function checkRole() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select(`
              *,
              roles(id, name, display_name)
            `)
            .eq("id", user.id)
            .single();

          if (profile) {
            setUserProfile(profile);
          }
        }
      } catch (err) {
        console.error("Error checking role in layout:", err);
      } finally {
        setIsLoading(false);
      }
    }
    checkRole();
  }, []);

  const ROLE_MAP: Record<string, { name: string; display_name: string }> = {
    "22222222-0000-0000-0000-000000000001": { name: "admin", display_name: "Administrador" },
    "22222222-0000-0000-0000-000000000002": { name: "rrhh", display_name: "Gestión Humana" },
    "22222222-0000-0000-0000-000000000003": { name: "gerencia", display_name: "Gerencia" },
    "22222222-0000-0000-0000-000000000004": { name: "lider", display_name: "Líder / Jefe" },
    "22222222-0000-0000-0000-000000000005": { name: "colaborador", display_name: "Colaborador" }
  };

  const roleInfo = userProfile?.role_id ? ROLE_MAP[userProfile.role_id] : null;
  const userRole = roleInfo?.name || userProfile?.roles?.name;
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
