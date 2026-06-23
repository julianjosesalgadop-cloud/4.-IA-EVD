"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
