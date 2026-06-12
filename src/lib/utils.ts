import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---- Date Formatters ----
export function formatDate(date: string | Date, pattern = "dd/MM/yyyy") {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern, { locale: es });
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy HH:mm", { locale: es });
}

export function formatRelative(date: string | Date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { locale: es, addSuffix: true });
}

export function formatMonth(date: string | Date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMMM yyyy", { locale: es });
}

// ---- Number Formatters ----
export function formatNumber(value: number, decimals = 0) {
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatPercentage(value: number, decimals = 1) {
  return `${formatNumber(value, decimals)}%`;
}

export function formatScore(score: number) {
  return score.toFixed(2);
}

// ---- Result Helpers ----
export function getResultLabel(result: string) {
  const labels: Record<string, string> = {
    aprobado: "Aprobado",
    plan_mejoramiento: "Plan de Mejoramiento",
    no_aprobado: "No Aprobado",
    pendiente: "Pendiente",
  };
  return labels[result] ?? result;
}

export function getResultColor(result: string) {
  const colors: Record<string, string> = {
    aprobado: "text-success-600 bg-success-50 border-success-200",
    plan_mejoramiento: "text-warning-600 bg-warning-50 border-warning-200",
    no_aprobado: "text-danger-600 bg-danger-50 border-danger-200",
    pendiente: "text-muted-foreground bg-muted border-border",
  };
  return colors[result] ?? "text-muted-foreground bg-muted";
}

export function getResultBadgeVariant(result: string): "default" | "success" | "warning" | "destructive" {
  const map: Record<string, "default" | "success" | "warning" | "destructive"> = {
    aprobado: "success",
    plan_mejoramiento: "warning",
    no_aprobado: "destructive",
    pendiente: "default",
  };
  return map[result] ?? "default";
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    borrador: "Borrador",
    en_proceso: "En Proceso",
    finalizada: "Finalizada",
    reabierta: "Reabierta",
    anulada: "Anulada",
    activo: "Activo",
    inactivo: "Inactivo",
    retirado: "Retirado",
    vacaciones: "Vacaciones",
    incapacidad: "Incapacidad",
  };
  return labels[status] ?? status;
}

export function getPMIStatusColor(status: string) {
  const colors: Record<string, string> = {
    activo: "text-warning-600 bg-warning-50 border-warning-200",
    en_seguimiento: "text-brand-600 bg-brand-50 border-brand-200",
    cerrado: "text-success-600 bg-success-50 border-success-200",
    vencido: "text-danger-600 bg-danger-50 border-danger-200",
  };
  return colors[status] ?? "text-muted-foreground bg-muted";
}

// ---- Score Helpers ----
export function getScoreLabel(score: number) {
  if (score >= 4.5) return "Excelente";
  if (score >= 3.5) return "Sobresaliente";
  if (score >= 2.5) return "Cumple lo esperado";
  if (score >= 1.5) return "Requiere mejora";
  return "No cumple";
}

export function getScoreColor(score: number) {
  if (score >= 4.0) return "text-success-600";
  if (score >= 3.1) return "text-warning-600";
  return "text-danger-600";
}

export function getScoreBgColor(score: number) {
  if (score >= 4.0) return "bg-success-500";
  if (score >= 3.1) return "bg-warning-500";
  return "bg-danger-500";
}

// ---- Role Helpers ----
export function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    admin: "Administrador",
    rrhh: "Gestión Humana",
    gerencia: "Gerencia",
    lider: "Líder / Jefe",
    colaborador: "Colaborador",
  };
  return labels[role] ?? role;
}

export function getRoleColor(role: string) {
  const colors: Record<string, string> = {
    admin: "bg-violet-100 text-violet-700 border-violet-200",
    rrhh: "bg-brand-100 text-brand-700 border-brand-200",
    gerencia: "bg-amber-100 text-amber-700 border-amber-200",
    lider: "bg-emerald-100 text-emerald-700 border-emerald-200",
    colaborador: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return colors[role] ?? "bg-muted text-muted-foreground";
}

// ---- Contract Type ----
export function getContractTypeLabel(type: string) {
  const labels: Record<string, string> = {
    indefinido: "Indefinido",
    fijo: "Término Fijo",
    obra_labor: "Obra o Labor",
    aprendizaje: "Aprendizaje",
    prestacion_servicios: "Prestación de Servicios",
    temporal: "Temporal",
  };
  return labels[type] ?? type;
}

// ---- Document Type ----
export function getDocumentTypeLabel(type: string) {
  const labels: Record<string, string> = {
    CC: "Cédula de Ciudadanía",
    CE: "Cédula de Extranjería",
    TI: "Tarjeta de Identidad",
    PP: "Pasaporte",
    NIT: "NIT",
    RUT: "RUT",
  };
  return labels[type] ?? type;
}

// ---- String helpers ----
export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function truncate(str: string, maxLength: number) {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ---- File helpers ----
export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---- Evaluation Calculator ----
export function calculateWeightedAverage(
  answers: Array<{ score: number; weight?: number }>
): number {
  const totalWeight = answers.reduce((sum, a) => sum + (a.weight ?? 1), 0);
  if (totalWeight === 0) return 0;
  const weightedSum = answers.reduce(
    (sum, a) => sum + a.score * (a.weight ?? 1),
    0
  );
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

export function determineResult(
  average: number,
  approvedThreshold = 4.0,
  pmiThreshold = 3.1
): "aprobado" | "plan_mejoramiento" | "no_aprobado" {
  if (average >= approvedThreshold) return "aprobado";
  if (average >= pmiThreshold) return "plan_mejoramiento";
  return "no_aprobado";
}

// ---- Array helpers ----
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}

export function sortBy<T>(array: T[], key: keyof T, order: "asc" | "desc" = "asc"): T[] {
  return [...array].sort((a, b) => {
    if (a[key] < b[key]) return order === "asc" ? -1 : 1;
    if (a[key] > b[key]) return order === "asc" ? 1 : -1;
    return 0;
  });
}

// ---- URL helpers ----
export function buildQueryString(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      qs.set(key, String(value));
    }
  });
  return qs.toString();
}

export async function compressImageIfNeeded(src: string, maxWidth: number = 400, maxHeight: number = 150): Promise<string> {
  if (typeof window === "undefined" || !src) return src;
  if (src.startsWith("http") && src.length < 500) return src;
  
  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = src;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (img.width <= maxWidth && img.height <= maxHeight) {
        resolve(src);
        return;
      }
      
      const canvas = window.document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(src);
        return;
      }
      
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      resolve(src);
    };
  });
}

