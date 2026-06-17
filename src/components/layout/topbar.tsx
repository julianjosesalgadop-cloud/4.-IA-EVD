"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, Menu, LogOut, User, Settings, ChevronDown, Building2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { logoutAction } from "@/app/actions/auth";

interface TopbarProps {
  collapsed: boolean;
  onMenuToggle: () => void;
  title?: string;
}

// Mock user data as fallback
const defaultUser = {
  name: "Admin Sistema",
  role: "Administrador",
  email: "admin@flotasugamuxi.com.co",
  initials: "AS",
};

export function Topbar({ collapsed, onMenuToggle, title }: TopbarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    role: string;
    email: string;
    initials: string;
  } | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email, roles(display_name, name)")
            .eq("id", authUser.id)
            .single();

          if (profile) {
            const roleDisplayName = (profile.roles as any)?.display_name || (profile.roles as any)?.name || "Colaborador";
            const name = profile.full_name || authUser.email?.split("@")[0] || "Usuario";
            const initials = name
              .split(" ")
              .filter(Boolean)
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            setCurrentUser({
              name,
              role: roleDisplayName,
              email: profile.email || authUser.email || "",
              initials: initials || "US",
            });
          } else {
            const name = authUser.email?.split("@")[0] || "Usuario";
            setCurrentUser({
              name,
              role: "Usuario",
              email: authUser.email || "",
              initials: name.slice(0, 2).toUpperCase() || "US",
            });
          }
        }
      } catch (err) {
        console.error("Error loading user in topbar:", err);
      }
    }
    loadUser();
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-40 h-16 px-4 md:pr-6 flex items-center gap-4 border-b bg-background/80 backdrop-blur-md transition-all duration-300 ease-in-out",
        collapsed ? "md:pl-[96px]" : "md:pl-[284px]"
      )}
      style={{ borderColor: "hsl(var(--border))" }}
    >
      {/* Menu Toggle - visible in mobile always, and in desktop when collapsed */}
      <button
        onClick={onMenuToggle}
        className={cn(
          "p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer",
          collapsed ? "flex" : "md:hidden flex"
        )}
        title={collapsed ? "Expandir menú" : "Colapsar menú"}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      {title && (
        <div className="hidden md:flex items-center gap-2">
          <h1 className="text-base font-semibold text-foreground">{title}</h1>
        </div>
      )}

      {/* Search */}
      <div className="flex-1 max-w-sm hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar colaboradores, evaluaciones..."
            className="w-full h-9 pl-9 pr-4 text-sm rounded-lg border bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl hover:bg-accent transition-colors cursor-pointer">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>

        {/* User Dropdown */}
        <div className="relative pl-2 border-l border-border flex items-center">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none cursor-pointer"
          >
            <div className="hidden md:block text-right select-none">
              <p className="text-sm font-semibold leading-tight text-foreground">
                {currentUser?.name || defaultUser.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentUser?.role || defaultUser.role}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold shadow-md">
              {currentUser?.initials || defaultUser.initials}
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
          </button>

          {/* Click outside overlay */}
          {showDropdown && (
            <div
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setShowDropdown(false)}
            />
          )}

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-popover text-popover-foreground shadow-lg z-50 overflow-hidden"
                style={{ borderColor: "hsl(var(--border))" }}
              >
                {/* Header */}
                <div className="p-3 border-b border-border/60 select-none">
                  <p className="text-xs text-muted-foreground font-medium">Sesión iniciada como</p>
                  <p className="text-sm font-bold text-foreground truncate mt-0.5">
                    {currentUser?.name || defaultUser.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentUser?.email || defaultUser.email}
                  </p>
                </div>

                {/* Items */}
                <div className="p-1.5 space-y-0.5">
                  <Link
                    href="/perfil"
                    onClick={() => setShowDropdown(false)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-accent transition-colors text-foreground"
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>Mi Perfil</span>
                  </Link>
                  <Link
                    href="/configuracion/empresa"
                    onClick={() => setShowDropdown(false)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-accent transition-colors text-foreground"
                  >
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span>Empresa</span>
                  </Link>
                  <Link
                    href="/configuracion/preguntas"
                    onClick={() => setShowDropdown(false)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-accent transition-colors text-foreground"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span>Configuración</span>
                  </Link>
                </div>

                {/* Logout Button */}
                <div className="p-1.5 border-t border-border/60 bg-muted/30">
                  <button
                    onClick={async () => {
                      setShowDropdown(false);
                      await logoutAction();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-danger-600 hover:bg-danger-50 hover:text-danger-700 dark:hover:bg-danger-950/40 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
