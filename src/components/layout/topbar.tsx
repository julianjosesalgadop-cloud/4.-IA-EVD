"use client";

import React from "react";
import { motion } from "framer-motion";
import { Bell, Search, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopbarProps {
  collapsed: boolean;
  onMenuToggle: () => void;
  title?: string;
}

// Mock user data
const user = {
  name: "Admin Sistema",
  role: "Administrador",
  email: "admin@flotasugamuxi.com.co",
  initials: "AS",
};

export function Topbar({ collapsed, onMenuToggle, title }: TopbarProps) {
  const sidebarWidth = collapsed ? 72 : 260;

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-40 h-16 px-4 md:pr-6 flex items-center gap-4 border-b bg-background/80 backdrop-blur-md transition-all duration-300 ease-in-out",
        collapsed ? "md:pl-[96px]" : "md:pl-[284px]"
      )}
      style={{ borderColor: "hsl(var(--border))" }}
    >
      {/* Mobile Menu */}
      <button
        onClick={onMenuToggle}
        className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
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
        <button className="relative p-2.5 rounded-xl hover:bg-accent transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>

        {/* User */}
        <div className="flex items-center gap-3 pl-2 border-l border-border">
          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold leading-tight">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.role}</p>
          </div>
          <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold shadow-md cursor-pointer">
            {user.initials}
          </div>
        </div>
      </div>
    </header>
  );
}
