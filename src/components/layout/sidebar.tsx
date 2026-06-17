"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, ClipboardList, Settings, TrendingUp,
  FileBarChart2, Bell, Shield, ChevronLeft, ChevronRight,
  Building2, BookOpen, MessageSquare, Target, LogOut,
  GraduationCap, ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavItem[];
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    groupTitle: "Menú Principal",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Colaboradores",
        icon: Users,
        children: [
          { title: "Nuevo Colaborador", href: "/colaboradores/nuevo", icon: Users },
          { title: "Listado Colaboradores", href: "/colaboradores", icon: Users },
        ],
      },
      {
        title: "Evaluaciones",
        icon: ClipboardList,
        children: [
          { title: "Nueva Evaluación", href: "/evaluaciones/nueva", icon: ClipboardList },
          { title: "Resultados Evaluaciones", href: "/evaluaciones", icon: ClipboardList },
        ],
      },
      // Plan de Mejoramiento oculto temporalmente
      // { title: "Plan de Mejoramiento", href: "/pmi", icon: Target },
      {
        title: "Reportes",
        href: "/reportes",
        icon: FileBarChart2,
      },
    ]
  },
  {
    groupTitle: "Administración & Configuración",
    items: [
      {
        title: "Configuración",
        icon: Settings,
        children: [
          { title: "Categorías", href: "/configuracion/categorias", icon: Settings },
          { title: "Preguntas", href: "/configuracion/preguntas", icon: Settings },
          { title: "Versiones", href: "/configuracion/versiones", icon: Settings },
          { title: "Empresa", href: "/configuracion/empresa", icon: Building2 },
        ],
      },
      {
        title: "Administración",
        icon: Building2,
        children: [
          { title: "Usuarios", href: "/administracion/usuarios", icon: Users },
          { title: "Roles", href: "/administracion/roles", icon: Shield },
          { title: "Áreas", href: "/administracion/areas", icon: Building2 },
          { title: "Cargos", href: "/administracion/cargos", icon: BookOpen },
          { title: "Importar Datos", href: "/administracion/importar", icon: FileBarChart2 },
        ],
      },
      {
        title: "Auditoría",
        href: "/auditoria",
        icon: Shield,
      },
    ]
  }
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Evaluaciones: true,
    Colaboradores: true,
  });

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/evaluaciones") {
      return pathname === "/evaluaciones" || (pathname.startsWith("/evaluaciones/") && pathname !== "/evaluaciones/nueva");
    }
    if (href === "/colaboradores") {
      return pathname === "/colaboradores" || (pathname.startsWith("/colaboradores/") && pathname !== "/colaboradores/nuevo");
    }
    return pathname.startsWith(href);
  };

  const isGroupActive = (item: NavItem) => {
    if (item.href) return isActive(item.href);
    return item.children?.some((child) => isActive(child.href)) ?? false;
  };

  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: collapsed ? 72 : 260,
        x: 0
      }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "fixed left-0 top-0 h-screen z-50 flex flex-col overflow-hidden border-r",
        "transition-transform md:translate-x-0",
        collapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"
      )}
      style={{
        background: "hsl(var(--sidebar-background))",
        borderColor: "hsl(var(--sidebar-border))",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border min-h-[72px]">
        {/* Logo Icon */}
        {!collapsed && (
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center overflow-hidden border shadow-lg shadow-brand-500/10">
              <img src="/logo.png" alt="Logo Flota Sugamuxi" className="w-full h-full object-contain p-0.5" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success-500 border-2 border-sidebar-background" />
          </div>
        )}

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-sm font-bold text-foreground leading-tight">Flota Sugamuxi</p>
              <p className="text-[11px] text-muted-foreground font-medium">EVD · Gestión Humana</p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onToggle}
          className={cn(
            "p-1 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground",
            collapsed ? "mx-auto w-8 h-8 flex items-center justify-center" : "ml-auto flex-shrink-0"
          )}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navGroups.map((group, groupIdx) => (
          <div key={group.groupTitle} className="space-y-1">
            {/* Divider / Group Title */}
            {collapsed ? (
              groupIdx > 0 && <div className="my-2 border-t border-sidebar-border/40" />
            ) : (
              <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider select-none">
                {group.groupTitle}
              </div>
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                if (item.children) {
                  const isOpen = openGroups[item.title] ?? isGroupActive(item);
                  const active = isGroupActive(item);

                  return (
                    <div key={item.title}>
                      <button
                        onClick={() => toggleGroup(item.title)}
                        className={cn(
                          "sidebar-link w-full",
                          active && !collapsed && "active"
                        )}
                        title={collapsed ? item.title : undefined}
                      >
                        <item.icon className={cn("w-5 h-5 flex-shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                        <AnimatePresence>
                          {!collapsed && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center justify-between flex-1 overflow-hidden"
                            >
                              <span className="truncate">{item.title}</span>
                              {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>

                      <AnimatePresence>
                        {isOpen && !collapsed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="pl-4 py-0.5 space-y-0.5">
                              {item.children.map((child) => (
                                <Link
                                  key={child.href}
                                  href={child.href!}
                                  className={cn(
                                    "sidebar-link text-xs",
                                    isActive(child.href) && "active"
                                  )}
                                >
                                  <div className={cn(
                                    "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                    isActive(child.href) ? "bg-primary" : "bg-muted-foreground/40"
                                  )} />
                                  <span className="truncate">{child.title}</span>
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={cn("sidebar-link relative", isActive(item.href) && "active")}
                    title={collapsed ? item.title : undefined}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isActive(item.href) ? "text-primary" : "text-muted-foreground"
                    )} />

                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="truncate flex-1"
                        >
                          {item.title}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {item.badge !== undefined && item.badge > 0 && (
                      <motion.span
                        className={cn(
                          "rounded-full text-[10px] font-bold",
                          collapsed
                            ? "absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-primary text-primary-foreground"
                            : "ml-auto min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-primary text-primary-foreground text-xs"
                        )}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="sidebar-link w-full"
          title={collapsed ? "Cambiar tema" : undefined}
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
          ) : (
            <Moon className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
          )}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm truncate"
              >
                {theme === "dark" ? "Modo claro" : "Modo oscuro"}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Logout */}
        <button
          onClick={async () => {
            await logoutAction();
          }}
          className="sidebar-link w-full text-danger-600 hover:bg-danger-50 hover:text-danger-700 dark:hover:bg-danger-950 transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm truncate"
              >
                Cerrar sesión
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
