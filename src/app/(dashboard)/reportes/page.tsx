"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  FileBarChart2,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  TrendingUp,
  Search,
  Loader2,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Users,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Mail,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import { toast } from "sonner";
import { getAreas, getPositions } from "@/app/actions/config";
import { getEvaluations, getLeadersReportData, LeaderReportItem } from "@/app/actions/evaluations";
import { getPMIs } from "@/app/actions/pmi";
import MultiSelectSearch from "@/components/ui/MultiSelectSearch";
import { formatScore, getResultLabel, getResultColor, compressImageIfNeeded, cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";

interface AreaData {
  id: string;
  name: string;
}

interface EvaluationItem {
  id: string;
  code?: string;
  collaborator: {
    full_name: string;
    document_number: string;
    hire_date?: string;
    position?: { name: string };
    positions?: { name: string };
    areas?: { name: string };
    area?: { name: string };
  };
  evaluator?: {
    first_name: string;
    last_name: string;
  };
  finalized_at?: string;
  created_at: string;
  result?: any;
}

function isEvdRequired(hireDateStr?: string | null): boolean {
  if (!hireDateStr) return true;
  const hireDate = new Date(hireDateStr);
  if (isNaN(hireDate.getTime())) return true;
  const now = new Date();
  let months = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());
  if (now.getDate() < hireDate.getDate()) months--;
  return months >= 6;
}

export default function ReportesPage() {
  // Navigation: active module
  const [activeReport, setActiveReport] = useState<"consolidado" | "pmi" | "lideres" | "ejecutivo">("consolidado");

  // General shared data
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [pmiList, setPmiList] = useState<any[]>([]);
  const [leadersData, setLeadersData] = useState<LeaderReportItem[]>([]);
  const [leadersSummary, setLeadersSummary] = useState({
    totalLeaders: 0,
    leadersWithEvaluations: 0,
    leadersWithoutEvaluations: 0,
    totalEvaluations: 0,
    completionPercentage: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  // =========================================================================
  // MÓDULO 1: FILTROS Y ESTADOS DE CONSOLIDADO GENERAL
  // =========================================================================
  const [searchGeneral, setSearchGeneral] = useState("");
  const [selectedAreasGeneral, setSelectedAreasGeneral] = useState<string[]>([]);
  const [selectedPositionsGeneral, setSelectedPositionsGeneral] = useState<string[]>([]);
  const [selectedEvaluatorsGeneral, setSelectedEvaluatorsGeneral] = useState<string[]>([]);
  const [selectedResultGeneral, setSelectedResultGeneral] = useState("");
  const [startDateGeneral, setStartDateGeneral] = useState("");
  const [endDateGeneral, setEndDateGeneral] = useState("");
  const [pageGeneral, setPageGeneral] = useState(1);
  const pageSizeGeneral = 10;
  const [sortFieldGeneral, setSortFieldGeneral] = useState<string>("collaborator");
  const [sortOrderGeneral, setSortOrderGeneral] = useState<"asc" | "desc">("asc");

  // Evaluator options derived from evaluations
  const evaluatorOptions = useMemo(() => {
    const names = new Set<string>();
    evaluations.forEach((e) => {
      if (e.evaluator?.first_name || e.evaluator?.last_name) {
        names.add(`${e.evaluator.first_name || ""} ${e.evaluator.last_name || ""}`.replace(/\s+/g, " ").trim());
      }
    });
    return Array.from(names).sort().map((name) => ({ id: name, name }));
  }, [evaluations]);

  const filteredGeneral = useMemo(() => {
    return evaluations.filter((item) => {
      const collabName = item.collaborator?.full_name || "";
      const docNum = item.collaborator?.document_number || "";
      const evalName = item.evaluator ? `${item.evaluator.first_name || ""} ${item.evaluator.last_name || ""}`.trim() : "";
      const code = item.code || "";

      // Text search
      if (searchGeneral) {
        const query = searchGeneral.toLowerCase();
        const matches =
          collabName.toLowerCase().includes(query) ||
          docNum.includes(query) ||
          evalName.toLowerCase().includes(query) ||
          code.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // Area
      if (selectedAreasGeneral.length > 0) {
        const aName = item.collaborator?.areas?.name || item.collaborator?.area?.name || "";
        if (!selectedAreasGeneral.includes(aName)) return false;
      }

      // Position
      if (selectedPositionsGeneral.length > 0) {
        const pName = item.collaborator?.positions?.name || item.collaborator?.position?.name || "";
        if (!selectedPositionsGeneral.includes(pName)) return false;
      }

      // Evaluator
      if (selectedEvaluatorsGeneral.length > 0) {
        if (!selectedEvaluatorsGeneral.includes(evalName)) return false;
      }

      // Result
      if (selectedResultGeneral) {
        const resObj = item.result && !Array.isArray(item.result) ? item.result : item.result?.[0] || null;
        if (resObj?.result !== selectedResultGeneral) return false;
      }

      // Dates
      if (startDateGeneral || endDateGeneral) {
        const itemDateStr = item.finalized_at || item.created_at;
        if (!itemDateStr) return false;
        const itemDate = new Date(itemDateStr);
        if (startDateGeneral) {
          const s = new Date(startDateGeneral);
          s.setHours(0, 0, 0, 0);
          if (itemDate < s) return false;
        }
        if (endDateGeneral) {
          const e = new Date(endDateGeneral);
          e.setHours(23, 59, 59, 999);
          if (itemDate > e) return false;
        }
      }

      return true;
    });
  }, [
    evaluations,
    searchGeneral,
    selectedAreasGeneral,
    selectedPositionsGeneral,
    selectedEvaluatorsGeneral,
    selectedResultGeneral,
    startDateGeneral,
    endDateGeneral,
  ]);

  const sortedGeneral = useMemo(() => {
    return [...filteredGeneral].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortFieldGeneral === "collaborator") {
        valA = (a.collaborator?.full_name || "").toLowerCase();
        valB = (b.collaborator?.full_name || "").toLowerCase();
      } else if (sortFieldGeneral === "position") {
        valA = (a.collaborator?.positions?.name || a.collaborator?.position?.name || "").toLowerCase();
        valB = (b.collaborator?.positions?.name || b.collaborator?.position?.name || "").toLowerCase();
      } else if (sortFieldGeneral === "area") {
        valA = (a.collaborator?.areas?.name || a.collaborator?.area?.name || "").toLowerCase();
        valB = (b.collaborator?.areas?.name || b.collaborator?.area?.name || "").toLowerCase();
      } else if (sortFieldGeneral === "score") {
        const resA = a.result && !Array.isArray(a.result) ? a.result : a.result?.[0] || null;
        const resB = b.result && !Array.isArray(b.result) ? b.result : b.result?.[0] || null;
        valA = resA ? Number(resA.overall_average) || 0 : 0;
        valB = resB ? Number(resB.overall_average) || 0 : 0;
      } else if (sortFieldGeneral === "result") {
        const resA = a.result && !Array.isArray(a.result) ? a.result : a.result?.[0] || null;
        const resB = b.result && !Array.isArray(b.result) ? b.result : b.result?.[0] || null;
        valA = resA ? (resA.result || "").toLowerCase() : "";
        valB = resB ? (resB.result || "").toLowerCase() : "";
      } else if (sortFieldGeneral === "evaluator") {
        valA = a.evaluator ? `${a.evaluator.first_name} ${a.evaluator.last_name}`.toLowerCase() : "";
        valB = b.evaluator ? `${b.evaluator.first_name} ${b.evaluator.last_name}`.toLowerCase() : "";
      } else if (sortFieldGeneral === "date") {
        valA = a.finalized_at ? new Date(a.finalized_at).getTime() : a.created_at ? new Date(a.created_at).getTime() : 0;
        valB = b.finalized_at ? new Date(b.finalized_at).getTime() : b.created_at ? new Date(b.created_at).getTime() : 0;
      }

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      if (valA < valB) return sortOrderGeneral === "asc" ? -1 : 1;
      if (valA > valB) return sortOrderGeneral === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredGeneral, sortFieldGeneral, sortOrderGeneral]);

  const pagedGeneral = useMemo(() => {
    const start = (pageGeneral - 1) * pageSizeGeneral;
    return sortedGeneral.slice(start, start + pageSizeGeneral);
  }, [sortedGeneral, pageGeneral]);

  const totalPagesGeneral = Math.ceil(sortedGeneral.length / pageSizeGeneral) || 1;

  const handleSortGeneral = (field: string) => {
    if (sortFieldGeneral === field) {
      setSortOrderGeneral(sortOrderGeneral === "asc" ? "desc" : "asc");
    } else {
      setSortFieldGeneral(field);
      setSortOrderGeneral("asc");
    }
  };

  // =========================================================================
  // MÓDULO 2: FILTROS Y ESTADOS DE SEGUIMIENTO PMI
  // =========================================================================
  const [searchPmi, setSearchPmi] = useState("");
  const [selectedAreasPmi, setSelectedAreasPmi] = useState<string[]>([]);
  const [pmiResultFilter, setPmiResultFilter] = useState("");
  const [pagePmi, setPagePmi] = useState(1);
  const pageSizePmi = 10;

  const filteredPmi = useMemo(() => {
    return pmiList.filter((item) => {
      const collab = item.evaluation?.collaborator;
      const collabName = collab?.full_name || "";
      const cargoName = collab?.positions?.name || "";
      const areaName = collab?.areas?.name || "";

      if (searchPmi) {
        const query = searchPmi.toLowerCase();
        if (!collabName.toLowerCase().includes(query) && !cargoName.toLowerCase().includes(query)) {
          return false;
        }
      }

      if (selectedAreasPmi.length > 0 && !selectedAreasPmi.includes(areaName)) {
        return false;
      }

      if (pmiResultFilter) {
        if (pmiResultFilter === "plan_mejoramiento" && item.result !== "plan_mejoramiento") return false;
        if (pmiResultFilter === "no_aprobado" && item.result !== "no_aprobado") return false;
      }

      return true;
    });
  }, [pmiList, searchPmi, selectedAreasPmi, pmiResultFilter]);

  const pagedPmi = useMemo(() => {
    const start = (pagePmi - 1) * pageSizePmi;
    return filteredPmi.slice(start, start + pageSizePmi);
  }, [filteredPmi, pagePmi]);

  const totalPagesPmi = Math.ceil(filteredPmi.length / pageSizePmi) || 1;

  // =========================================================================
  // MÓDULO 3: FILTROS Y ESTADOS DE GESTIÓN POR LÍDER
  // =========================================================================
  const [searchLeader, setSearchLeader] = useState("");
  const [leaderStatusFilter, setLeaderStatusFilter] = useState<"all" | "with_evals" | "without_evals">("all");
  const [leaderSortOrder, setLeaderSortOrder] = useState<"evals_desc" | "evals_asc" | "name_asc" | "name_desc" | "score_desc">("evals_desc");
  const [pageLeaders, setPageLeaders] = useState(1);
  const pageSizeLeaders = 10;

  const filteredLeaders = useMemo(() => {
    let result = leadersData.filter((item) => {
      // Text search: Name or Email
      if (searchLeader) {
        const q = searchLeader.toLowerCase();
        const matches = item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Status filter
      if (leaderStatusFilter === "with_evals" && !item.hasEvaluations) return false;
      if (leaderStatusFilter === "without_evals" && item.hasEvaluations) return false;

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (leaderSortOrder === "evals_desc") return b.totalEvaluations - a.totalEvaluations || a.name.localeCompare(b.name);
      if (leaderSortOrder === "evals_asc") return a.totalEvaluations - b.totalEvaluations || a.name.localeCompare(b.name);
      if (leaderSortOrder === "name_asc") return a.name.localeCompare(b.name);
      if (leaderSortOrder === "name_desc") return b.name.localeCompare(a.name);
      if (leaderSortOrder === "score_desc") return b.averageScore - a.averageScore || b.totalEvaluations - a.totalEvaluations;
      return 0;
    });

    return result;
  }, [leadersData, searchLeader, leaderStatusFilter, leaderSortOrder]);

  const pagedLeaders = useMemo(() => {
    const start = (pageLeaders - 1) * pageSizeLeaders;
    return filteredLeaders.slice(start, start + pageSizeLeaders);
  }, [filteredLeaders, pageLeaders]);

  const totalPagesLeaders = Math.ceil(filteredLeaders.length / pageSizeLeaders) || 1;

  // =========================================================================
  // MÓDULO 4: FILTROS Y ESTADOS DE RESUMEN EJECUTIVO
  // =========================================================================
  const [selectedExecutiveArea, setSelectedExecutiveArea] = useState<string>("");

  const executiveData = useMemo(() => {
    let dataset = evaluations;
    if (selectedExecutiveArea) {
      dataset = dataset.filter((e) => {
        const a = e.collaborator?.areas?.name || e.collaborator?.area?.name || "";
        return a === selectedExecutiveArea;
      });
    }

    const total = dataset.length;
    let scoreSum = 0;
    let approved = 0;
    let pmi = 0;
    let notApproved = 0;

    const areaStats: Record<string, { total: number; sum: number; approved: number }> = {};
    const catStats: Record<string, { sum: number; count: number }> = {};

    dataset.forEach((item) => {
      const resObj = item.result && !Array.isArray(item.result) ? item.result : item.result?.[0] || null;
      if (resObj) {
        const score = Number(resObj.overall_average) || 0;
        scoreSum += score;
        if (resObj.result === "aprobado") approved++;
        else if (resObj.result === "plan_mejoramiento") pmi++;
        else if (resObj.result === "no_aprobado") notApproved++;

        const aName = item.collaborator?.areas?.name || item.collaborator?.area?.name || "Sin Área";
        if (!areaStats[aName]) areaStats[aName] = { total: 0, sum: 0, approved: 0 };
        areaStats[aName].total++;
        areaStats[aName].sum += score;
        if (resObj.result === "aprobado") areaStats[aName].approved++;

        if (resObj.category_scores) {
          const cats = Array.isArray(resObj.category_scores)
            ? resObj.category_scores
            : Object.values(resObj.category_scores);
          cats.forEach((cat: any) => {
            if (cat?.name && (cat.average !== undefined || cat.score !== undefined)) {
              const val = cat.average !== undefined ? cat.average : cat.score;
              if (!catStats[cat.name]) catStats[cat.name] = { sum: 0, count: 0 };
              catStats[cat.name].sum += Number(val) || 0;
              catStats[cat.name].count++;
            }
          });
        }
      }
    });

    const average = total > 0 ? Number((scoreSum / total).toFixed(2)) : 0;
    const approvalRate = total > 0 ? Number(((approved / total) * 100).toFixed(1)) : 0;

    return {
      total,
      average,
      approved,
      pmi,
      notApproved,
      approvalRate,
      areaStats,
      catStats,
    };
  }, [evaluations, selectedExecutiveArea]);

  // =========================================================================
  // CARGA INICIAL DE DATOS
  // =========================================================================
  useEffect(() => {
    async function loadAllData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        let roleName = "";
        let uid = "";

        if (user) {
          uid = user.id;
          setCurrentUserId(user.id);
          const { data: profile } = await supabase
            .from("profiles")
            .select("roles(name)")
            .eq("id", user.id)
            .single();
          if (profile) {
            roleName = (profile.roles as any)?.name || "";
            setCurrentUserRole(roleName);
          }
        }

        const [areasData, positionsData, evalsRes, leadersRes, pmiRes] = await Promise.all([
          getAreas(),
          getPositions(),
          getEvaluations(),
          getLeadersReportData(),
          getPMIs(),
        ]);

        setAreas(areasData || []);
        setPositions(positionsData || []);

        if (evalsRes.data) {
          let loadedEvals = evalsRes.data as any[];
          if (roleName === "lider") {
            loadedEvals = loadedEvals.filter((item) => item.evaluator_id === uid);
          }
          setEvaluations(loadedEvals);
        }

        if (leadersRes.data) {
          setLeadersData(leadersRes.data);
          setLeadersSummary(leadersRes.summary);
        }

        if (pmiRes.data) {
          setPmiList(pmiRes.data);
        }
      } catch (error) {
        console.error("Error loading reports data:", error);
        toast.error("Error al cargar la información de reportes");
      } finally {
        setIsLoading(false);
      }
    }
    loadAllData();
  }, []);

  // =========================================================================
  // EXPORTACIONES A EXCEL Y PDF
  // =========================================================================

  // Export Excel: Consolidado General Completo
  const handleExportConsolidado = async () => {
    if (evaluations.length === 0) {
      toast.error("No hay evaluaciones disponibles para exportar");
      return;
    }

    const toastId = toast.loading("Generando Excel consolidado...");
    try {
      const uniqueCategories = new Set<string>();
      evaluations.forEach((item) => {
        const resObj = item.result && !Array.isArray(item.result) ? item.result : item.result?.[0] || null;
        if (resObj && resObj.category_scores) {
          const cats = Array.isArray(resObj.category_scores)
            ? resObj.category_scores
            : Object.values(resObj.category_scores);
          cats.forEach((cat: any) => {
            if (cat?.name) uniqueCategories.add(cat.name);
          });
        }
      });
      const categoriesList = Array.from(uniqueCategories).sort();

      const collaboratorRows = evaluations.map((item) => {
        const resObj = item.result && !Array.isArray(item.result) ? item.result : item.result?.[0] || null;
        const row: Record<string, any> = {
          "ID Evaluación": item.code || "—",
          "Colaborador": item.collaborator?.full_name || "N/A",
          "Documento": item.collaborator?.document_number || "N/A",
          "Área": item.collaborator?.areas?.name || item.collaborator?.area?.name || "N/A",
          "Cargo": item.collaborator?.positions?.name || item.collaborator?.position?.name || "N/A",
          "Evaluador": item.evaluator ? `${item.evaluator.first_name} ${item.evaluator.last_name}` : "N/A",
          "Antigüedad": isEvdRequired(item.collaborator?.hire_date) ? "Requerido" : "No Requerido",
          "EVD 2026": item.finalized_at || (item as any).status === "finalizada" ? "Realizada" : "Pendiente",
          "Fecha Finalización": item.finalized_at ? new Date(item.finalized_at).toLocaleDateString("es-ES") : "Pendiente",
        };

        const cats = resObj?.category_scores
          ? (Array.isArray(resObj.category_scores) ? resObj.category_scores : Object.values(resObj.category_scores))
          : [];

        categoriesList.forEach((catName) => {
          let scoreVal: any = "—";
          if (resObj && cats.length > 0) {
            const catMatch = cats.find((c: any) => c.name === catName) as any;
            if (catMatch && catMatch.average !== undefined) scoreVal = Number(formatScore(catMatch.average));
            else if (catMatch && catMatch.score !== undefined) scoreVal = Number(formatScore(catMatch.score));
          }
          row[`Promedio: ${catName}`] = scoreVal;
        });

        row["Promedio General"] = resObj ? Number(formatScore(resObj.overall_average)) : "Pendiente";
        row["Resultado EVD"] = resObj ? getResultLabel(resObj.result) : "Pendiente";
        return row;
      });

      const workbook = XLSX.utils.book_new();
      const wsCollab = XLSX.utils.json_to_sheet(collaboratorRows);
      XLSX.utils.book_append_sheet(workbook, wsCollab, "Resultados Colaboradores");

      XLSX.writeFile(workbook, `Reporte_Consolidado_EVD_${new Date().getFullYear()}.xlsx`);
      toast.success("Excel Consolidado descargado exitosamente", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Error al exportar a Excel", { id: toastId });
    }
  };

  // Export Excel: Consolidado Filtrado
  const handleExportFilteredGeneralExcel = () => {
    if (filteredGeneral.length === 0) {
      toast.error("No hay resultados de búsqueda para exportar");
      return;
    }
    const toastId = toast.loading("Exportando resultados filtrados...");
    try {
      const rows = filteredGeneral.map((item) => {
        const resObj = item.result && !Array.isArray(item.result) ? item.result : item.result?.[0] || null;
        return {
          "Código": item.code || "—",
          "Colaborador": item.collaborator?.full_name || "N/A",
          "Documento": item.collaborator?.document_number || "N/A",
          "Área": item.collaborator?.areas?.name || item.collaborator?.area?.name || "N/A",
          "Cargo": item.collaborator?.positions?.name || item.collaborator?.position?.name || "N/A",
          "Evaluador": item.evaluator ? `${item.evaluator.first_name} ${item.evaluator.last_name}` : "N/A",
          "Puntaje": resObj ? Number(formatScore(resObj.overall_average)) : "—",
          "Resultado": resObj ? getResultLabel(resObj.result) : "Pendiente",
          "Fecha": item.finalized_at
            ? new Date(item.finalized_at).toLocaleDateString("es-ES")
            : new Date(item.created_at).toLocaleDateString("es-ES"),
        };
      });

      const workbook = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, ws, "Evaluaciones Filtradas");
      XLSX.writeFile(workbook, `Reporte_EVD_Filtrado_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Excel exportado exitosamente", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Error al exportar", { id: toastId });
    }
  };

  // Export Excel: Seguimiento PMI
  const handleExportPMI = async () => {
    if (pmiList.length === 0) {
      toast.error("No hay planes de mejoramiento (PMI) registrados");
      return;
    }
    const toastId = toast.loading("Generando reporte de PMI...");
    try {
      const rows = pmiList.map((item) => {
        const collab = item.evaluation?.collaborator;
        return {
          "ID Evaluación": item.evaluation?.id || "—",
          "Colaborador": collab?.full_name || "N/A",
          "Área": collab?.areas?.name || "N/A",
          "Cargo": collab?.positions?.name || "N/A",
          "Calificación Obtenida": item.overall_average ? Number(formatScore(item.overall_average)) : "—",
          "Resultado": getResultLabel(item.result),
          "Requiere PMI": item.pmi_required ? "Sí" : "No",
          "Fecha Evaluación": item.created_at ? new Date(item.created_at).toLocaleDateString("es-ES") : "—",
        };
      });

      const workbook = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, ws, "Seguimiento PMI");
      XLSX.writeFile(workbook, `Reporte_PMI_${new Date().getFullYear()}.xlsx`);
      toast.success("Excel de PMI generado exitosamente", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Error al exportar PMI", { id: toastId });
    }
  };

  // Export Excel: Informe de Gestión por Líder (INFORME SOLICITADO)
  const handleExportLeadersExcel = (dataToExport = leadersData, isFiltered = false) => {
    const toastId = toast.loading("Generando Excel de gestión de líderes...");
    try {
      // Hoja 1: Resumen General de Líderes
      const summaryRows = dataToExport.map((item, idx) => ({
        "N°": idx + 1,
        "Líder / Jefe": item.name,
        "Correo Electrónico": item.email,
        "Estado Gestión": item.totalEvaluations > 0 ? "Con Evaluaciones Realizadas" : "Sin Evaluaciones Realizadas",
        "Total Evaluaciones": item.totalEvaluations,
        "Evaluaciones Finalizadas": item.finalizedCount,
        "Pendientes de Firma": item.pendingSignatureCount,
        "En Proceso": item.inProgressCount,
        "Borradores": item.draftCount,
        "Calificación Promedio Otorgada": item.averageScore > 0 ? item.averageScore : "N/A",
        "Última Evaluación": item.lastEvaluationDate ? new Date(item.lastEvaluationDate).toLocaleDateString("es-ES") : "Ninguna",
      }));

      // Hoja 2: Líderes Sin Evaluaciones Realizadas (Prioridad RRHH)
      const withoutEvalsRows = dataToExport
        .filter((item) => item.totalEvaluations === 0)
        .map((item, idx) => ({
          "N°": idx + 1,
          "Líder / Jefe": item.name,
          "Correo Electrónico": item.email,
          "Teléfono": item.phone || "No registrado",
          "Evaluaciones Realizadas": 0,
          "Estado de Cumplimiento": "Pendiente por Iniciar",
          "Alerta RRHH": "Requiere asignación y seguimiento de evaluaciones de su personal a cargo",
        }));

      const workbook = XLSX.utils.book_new();

      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(workbook, wsSummary, isFiltered ? "Líderes Filtrados" : "Gestión por Líder");

      if (withoutEvalsRows.length > 0) {
        const wsPending = XLSX.utils.json_to_sheet(withoutEvalsRows);
        XLSX.utils.book_append_sheet(workbook, wsPending, "Líderes Sin Evaluaciones");
      }

      const fileName = isFiltered
        ? `Reporte_Lideres_Filtrado_${new Date().toISOString().slice(0, 10)}.xlsx`
        : `Informe_Gestion_Lideres_EVD_${new Date().getFullYear()}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      toast.success("Informe de líderes descargado exitosamente", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Error al exportar reporte de líderes", { id: toastId });
    }
  };

  // Export PDF: Resumen Ejecutivo
  const handleExportExecutivePDF = async () => {
    const toastId = toast.loading("Generando Resumen Ejecutivo PDF...");
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const brandColorBlue = [1, 33, 105]; // #012169
      const brandColorLightBlue = [0, 132, 213]; // #0084D5
      const textColorDark = [30, 41, 59];
      const textColorMuted = [100, 116, 139];
      const marginX = 15;

      let logoImg: HTMLImageElement | null = null;
      try {
        const logoSrc = await compressImageIfNeeded("/logo.png", 200, 200);
        logoImg = await new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image();
          img.src = logoSrc;
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        });
      } catch {}

      let textStartX = marginX;
      if (logoImg) {
        doc.addImage(logoImg, "PNG", marginX, 6, 13, 13);
        textStartX = marginX + 16;
      }

      // Title bar
      doc.setFillColor(brandColorBlue[0], brandColorBlue[1], brandColorBlue[2]);
      doc.rect(0, 0, 210, 4, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(brandColorBlue[0], brandColorBlue[1], brandColorBlue[2]);
      doc.text("FLOTA SUGAMUXI S.A.", textStartX, 14);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
      doc.text("Sistema de Evaluación de Desempeño (EVD)", textStartX, 19);

      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, 22, 210 - marginX, 22);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(brandColorBlue[0], brandColorBlue[1], brandColorBlue[2]);
      doc.text("RESUMEN EJECUTIVO DE DESEMPEÑO EVD", marginX, 32);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString("es-ES")}`, marginX, 38);

      let currentY = 46;

      // Executive Summary KPI Box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(marginX, currentY, 180, 32, 2, 2, "F");
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginX, currentY, 180, 32, 2, 2, "D");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(brandColorBlue[0], brandColorBlue[1], brandColorBlue[2]);
      doc.text("MÉTRICAS CLAVE CONSOLIDADAS", marginX + 5, currentY + 7);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);

      doc.text(`Total Evaluaciones Realizadas: ${executiveData.total}`, marginX + 5, currentY + 15);
      doc.text(`Promedio General Obtenido: ${executiveData.average} / 5.0`, marginX + 5, currentY + 22);
      doc.text(`Tasa Global de Aprobación: ${executiveData.approvalRate}%`, marginX + 5, currentY + 28);

      doc.text(`Evaluaciones Aprobadas: ${executiveData.approved}`, marginX + 95, currentY + 15);
      doc.text(`Con Plan de Mejoramiento (PMI): ${executiveData.pmi}`, marginX + 95, currentY + 22);
      doc.text(`No Aprobados: ${executiveData.notApproved}`, marginX + 95, currentY + 28);

      currentY += 40;

      // Area breakdown table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
      doc.text("2. DESEMPEÑO PROMEDIO POR ÁREA", marginX, currentY);
      currentY += 4;

      const areaHeaders = [["Área de la Empresa", "Total Evaluaciones", "Promedio General", "% Aprobación"]];
      const areaRows = Object.entries(executiveData.areaStats).map(([name, stat]) => [
        name,
        stat.total.toString(),
        `${(stat.sum / stat.total).toFixed(2)} / 5.0`,
        `${((stat.approved / stat.total) * 100).toFixed(0)}%`,
      ]);

      autoTable(doc, {
        startY: currentY,
        head: areaHeaders,
        body: areaRows,
        theme: "striped",
        headStyles: { fillColor: brandColorBlue as any, textColor: [255, 255, 255] as any, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2, textColor: textColorDark as any },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 80 },
          1: { cellWidth: 35, halign: "center" },
          2: { cellWidth: 35, halign: "center" },
          3: { cellWidth: 30, halign: "center" },
        },
        margin: { left: marginX, right: marginX, top: 26, bottom: 24 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
      if (currentY > 210) {
        doc.addPage();
        currentY = 28;
      }

      // Category breakdown table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
      doc.text("3. CALIFICACIÓN PROMEDIO POR CATEGORÍA", marginX, currentY);
      currentY += 4;

      const catHeaders = [["Categoría de Competencia", "Calificación Promedio"]];
      const catRows = Object.entries(executiveData.catStats).map(([name, stat]) => [
        name,
        `${(stat.sum / stat.count).toFixed(2)} / 5.0`,
      ]);

      autoTable(doc, {
        startY: currentY,
        head: catHeaders,
        body: catRows,
        theme: "striped",
        headStyles: { fillColor: brandColorBlue as any, textColor: [255, 255, 255] as any, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2, textColor: textColorDark as any },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 120 },
          1: { cellWidth: 60, halign: "center" },
        },
        margin: { left: marginX, right: marginX, top: 26, bottom: 24 },
      });

      // Headers & Footers on all pages
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(brandColorBlue[0], brandColorBlue[1], brandColorBlue[2]);
        doc.rect(0, 0, 210, 4, "F");

        if (logoImg) doc.addImage(logoImg, "PNG", marginX, 6, 13, 13);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(brandColorBlue[0], brandColorBlue[1], brandColorBlue[2]);
        doc.text("FLOTA SUGAMUXI S.A.", textStartX, 14);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
        doc.text("Sistema de Evaluación de Desempeño (EVD)", textStartX, 19);

        doc.setDrawColor(226, 232, 240);
        doc.line(marginX, 22, 210 - marginX, 22);

        doc.text(`Generado el: ${new Date().toLocaleDateString("es-ES")}`, marginX, 285);
        doc.text(`Página ${i} de ${totalPages}`, 210 - marginX, 285, { align: "right" });
        doc.line(marginX, 280, 210 - marginX, 280);
      }

      doc.save(`Resumen_Ejecutivo_EVD_${new Date().getFullYear()}.pdf`);
      toast.success("PDF generado exitosamente", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Error al generar el PDF", { id: toastId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <p className="text-sm text-muted-foreground font-medium">Cargando módulos de reportes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileBarChart2 className="w-6 h-6 text-brand-500" />
            Reportes y Estadísticas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visualiza, filtra y genera informes consolidados de desempeño en Excel o PDF
          </p>
        </div>
      </div>

      {/* Cards Panel (4 Report Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Consolidado General */}
        <div
          onClick={() => setActiveReport("consolidado")}
          className={cn(
            "p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group",
            activeReport === "consolidado"
              ? "bg-gradient-to-b from-card to-success-50/20 border-success-500 ring-2 ring-success-500/20 shadow-md"
              : "bg-card border-border hover:border-success-400 hover:shadow-md"
          )}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-success-500/10 flex items-center justify-center text-success-600 shadow-sm">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              {activeReport === "consolidado" ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-500/15 text-success-700 dark:text-success-300">
                  Módulo Activo
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {evaluations.length} evd
                </span>
              )}
            </div>
            <h3 className="font-bold text-base text-foreground mb-1">Consolidado General</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
              Informe completo de evaluaciones por colaborador, cargo y área con desgloses de competencias.
            </p>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs font-semibold text-success-600">
            <span>Filtrar y Ver</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExportConsolidado();
              }}
              className="flex items-center gap-1 hover:underline text-[11px] font-medium text-muted-foreground hover:text-success-600"
              title="Descargar Excel completo"
            >
              <Download className="w-3.5 h-3.5" /> Excel
            </button>
          </div>
        </div>

        {/* Card 2: Seguimiento PMI */}
        <div
          onClick={() => setActiveReport("pmi")}
          className={cn(
            "p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group",
            activeReport === "pmi"
              ? "bg-gradient-to-b from-card to-warning-50/20 border-warning-500 ring-2 ring-warning-500/20 shadow-md"
              : "bg-card border-border hover:border-warning-400 hover:shadow-md"
          )}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-warning-500/10 flex items-center justify-center text-warning-600 shadow-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
              {activeReport === "pmi" ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning-500/15 text-warning-700 dark:text-warning-300">
                  Módulo Activo
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning-100 text-warning-700 dark:bg-warning-950/40 dark:text-warning-300">
                  {pmiList.length} casos
                </span>
              )}
            </div>
            <h3 className="font-bold text-base text-foreground mb-1">Seguimiento PMI</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
              Planes de mejoramiento (PMI), compromisos pactados y fechas límite a 30/60/90 días.
            </p>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs font-semibold text-warning-600">
            <span>Filtrar y Ver</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExportPMI();
              }}
              className="flex items-center gap-1 hover:underline text-[11px] font-medium text-muted-foreground hover:text-warning-600"
              title="Descargar Excel PMI"
            >
              <Download className="w-3.5 h-3.5" /> Excel
            </button>
          </div>
        </div>

        {/* Card 3: Evaluaciones por Líder (NUEVO) */}
        <div
          onClick={() => setActiveReport("lideres")}
          className={cn(
            "p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group",
            activeReport === "lideres"
              ? "bg-gradient-to-b from-card to-indigo-50/20 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
              : "bg-card border-border hover:border-indigo-400 hover:shadow-md"
          )}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-sm">
                <Users className="w-5 h-5" />
              </div>
              {activeReport === "lideres" ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                  Módulo Activo
                </span>
              ) : leadersSummary.leadersWithoutEvaluations > 0 ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger-100 text-danger-700 dark:bg-danger-950/40 dark:text-danger-300">
                  {leadersSummary.leadersWithoutEvaluations} sin evaluar
                </span>
              ) : null}
            </div>
            <h3 className="font-bold text-base text-foreground mb-1">Evaluaciones por Líder</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
              Informe de evaluaciones por líder y detección de líderes sin evaluaciones registradas.
            </p>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs font-semibold text-indigo-600">
            <span>Filtrar y Ver</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExportLeadersExcel();
              }}
              className="flex items-center gap-1 hover:underline text-[11px] font-medium text-muted-foreground hover:text-indigo-600"
              title="Descargar Excel Líderes"
            >
              <Download className="w-3.5 h-3.5" /> Excel
            </button>
          </div>
        </div>

        {/* Card 4: Resumen Ejecutivo */}
        <div
          onClick={() => setActiveReport("ejecutivo")}
          className={cn(
            "p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group",
            activeReport === "ejecutivo"
              ? "bg-gradient-to-b from-card to-brand-50/20 border-brand-500 ring-2 ring-brand-500/20 shadow-md"
              : "bg-card border-border hover:border-brand-400 hover:shadow-md"
          )}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600 shadow-sm">
                <FileText className="w-5 h-5" />
              </div>
              {activeReport === "ejecutivo" ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-700 dark:text-brand-300">
                  Módulo Activo
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  PDF Oficial
                </span>
              )}
            </div>
            <h3 className="font-bold text-base text-foreground mb-1">Resumen Ejecutivo</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
              Informe gerencial consolidado con promedios por área y desgloses de competencias.
            </p>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs font-semibold text-brand-600">
            <span>Filtrar y Ver</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExportExecutivePDF();
              }}
              className="flex items-center gap-1 hover:underline text-[11px] font-medium text-muted-foreground hover:text-brand-600"
              title="Descargar PDF Resumen Ejecutivo"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="flex items-center border-b border-border bg-card rounded-t-2xl px-3 pt-3 gap-1 sm:gap-2 overflow-x-auto shadow-sm">
        <button
          onClick={() => setActiveReport("consolidado")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap",
            activeReport === "consolidado"
              ? "border-success-500 text-success-600 bg-success-500/5 font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Consolidado General</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-bold">
            {filteredGeneral.length}
          </span>
        </button>

        <button
          onClick={() => setActiveReport("pmi")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap",
            activeReport === "pmi"
              ? "border-warning-500 text-warning-600 bg-warning-500/5 font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Seguimiento PMI</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-warning-100 text-warning-700 dark:bg-warning-950/40 dark:text-warning-300 font-bold">
            {filteredPmi.length}
          </span>
        </button>

        <button
          onClick={() => setActiveReport("lideres")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap",
            activeReport === "lideres"
              ? "border-indigo-500 text-indigo-600 bg-indigo-500/5 font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
        >
          <Users className="w-4 h-4" />
          <span>Evaluaciones por Líder</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-bold">
            {filteredLeaders.length}
          </span>
          {leadersSummary.leadersWithoutEvaluations > 0 && (
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-danger-100 text-danger-700 dark:bg-danger-950/40 dark:text-danger-300 font-bold flex items-center gap-1">
              <AlertCircle className="w-2.5 h-2.5" />
              {leadersSummary.leadersWithoutEvaluations} sin evaluar
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveReport("ejecutivo")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap",
            activeReport === "ejecutivo"
              ? "border-brand-500 text-brand-600 bg-brand-500/5 font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
        >
          <FileText className="w-4 h-4" />
          <span>Resumen Ejecutivo</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MÓDULO 1: VISTA CONSOLIDADO GENERAL                                        */}
      {/* ========================================================================= */}
      {activeReport === "consolidado" && (
        <div className="rounded-b-2xl border border-t-0 bg-card p-5 sm:p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Filter className="w-5 h-5 text-success-600" />
                Filtros: Consolidado General de Evaluaciones
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Filtra por colaborador, área, cargo, evaluador o rango de fechas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportFilteredGeneralExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-success-200 bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-950/30 dark:border-success-800 dark:text-success-300 text-xs font-semibold transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Exportar Filtrados (Excel)
              </button>
              <button
                onClick={handleExportConsolidado}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-brand text-white text-xs font-semibold shadow hover:opacity-90 transition-opacity"
              >
                <Download className="w-3.5 h-3.5" />
                Consolidado Completo
              </button>
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="relative">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Buscar</label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchGeneral}
                  onChange={(e) => {
                    setSearchGeneral(e.target.value);
                    setPageGeneral(1);
                  }}
                  placeholder="Colaborador o doc..."
                  className="w-full h-[38px] pl-8 pr-2.5 rounded-xl border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <MultiSelectSearch
                options={areas}
                selectedValues={selectedAreasGeneral}
                onChange={(vals) => {
                  setSelectedAreasGeneral(vals);
                  setPageGeneral(1);
                }}
                placeholder="Todas las áreas"
                searchPlaceholder="Buscar área..."
                label="Área"
              />
            </div>

            <div>
              <MultiSelectSearch
                options={positions}
                selectedValues={selectedPositionsGeneral}
                onChange={(vals) => {
                  setSelectedPositionsGeneral(vals);
                  setPageGeneral(1);
                }}
                placeholder="Todos los cargos"
                searchPlaceholder="Buscar cargo..."
                label="Cargo"
              />
            </div>

            <div>
              <MultiSelectSearch
                options={evaluatorOptions}
                selectedValues={selectedEvaluatorsGeneral}
                onChange={(vals) => {
                  setSelectedEvaluatorsGeneral(vals);
                  setPageGeneral(1);
                }}
                placeholder="Todos los evaluadores"
                searchPlaceholder="Buscar evaluador..."
                label="Evaluador"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Resultado</label>
              <select
                value={selectedResultGeneral}
                onChange={(e) => {
                  setSelectedResultGeneral(e.target.value);
                  setPageGeneral(1);
                }}
                className="w-full h-[38px] mt-1 px-2.5 rounded-xl border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Todos los resultados</option>
                <option value="aprobado">Aprobado</option>
                <option value="plan_mejoramiento">Plan de Mejoramiento</option>
                <option value="no_aprobado">No Aprobado</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Fecha Inicio</label>
              <input
                type="date"
                value={startDateGeneral}
                onChange={(e) => {
                  setStartDateGeneral(e.target.value);
                  setPageGeneral(1);
                }}
                className="w-full h-[38px] mt-1 px-2.5 rounded-xl border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-4">
            <span>
              Mostrando <strong className="text-foreground">{sortedGeneral.length}</strong> de{" "}
              {evaluations.length} evaluaciones registradas
            </span>
            {(searchGeneral || selectedAreasGeneral.length > 0 || selectedPositionsGeneral.length > 0 || selectedEvaluatorsGeneral.length > 0 || selectedResultGeneral || startDateGeneral) && (
              <button
                onClick={() => {
                  setSearchGeneral("");
                  setSelectedAreasGeneral([]);
                  setSelectedPositionsGeneral([]);
                  setSelectedEvaluatorsGeneral([]);
                  setSelectedResultGeneral("");
                  setStartDateGeneral("");
                  setPageGeneral(1);
                }}
                className="text-xs text-brand-600 hover:underline flex items-center gap-1 font-medium"
              >
                <X className="w-3.5 h-3.5" /> Limpiar filtros
              </button>
            )}
          </div>

          {/* Table */}
          {sortedGeneral.length > 0 ? (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b text-muted-foreground uppercase font-semibold">
                      <th className="p-3 cursor-pointer select-none" onClick={() => handleSortGeneral("collaborator")}>
                        <div className="flex items-center gap-1 hover:text-foreground">
                          Colaborador
                          {sortFieldGeneral === "collaborator" ? (
                            sortOrderGeneral === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />
                          ) : <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />}
                        </div>
                      </th>
                      <th className="p-3 cursor-pointer select-none" onClick={() => handleSortGeneral("position")}>
                        <div className="flex items-center gap-1 hover:text-foreground">
                          Cargo
                          {sortFieldGeneral === "position" ? (
                            sortOrderGeneral === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />
                          ) : <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />}
                        </div>
                      </th>
                      <th className="p-3 cursor-pointer select-none" onClick={() => handleSortGeneral("area")}>
                        <div className="flex items-center gap-1 hover:text-foreground">
                          Área
                          {sortFieldGeneral === "area" ? (
                            sortOrderGeneral === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />
                          ) : <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />}
                        </div>
                      </th>
                      <th className="p-3 cursor-pointer select-none" onClick={() => handleSortGeneral("evaluator")}>
                        <div className="flex items-center gap-1 hover:text-foreground">
                          Evaluador
                          {sortFieldGeneral === "evaluator" ? (
                            sortOrderGeneral === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />
                          ) : <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />}
                        </div>
                      </th>
                      <th className="p-3 text-center cursor-pointer select-none" onClick={() => handleSortGeneral("score")}>
                        <div className="flex items-center justify-center gap-1 hover:text-foreground">
                          Calificación
                          {sortFieldGeneral === "score" ? (
                            sortOrderGeneral === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />
                          ) : <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />}
                        </div>
                      </th>
                      <th className="p-3 text-center cursor-pointer select-none" onClick={() => handleSortGeneral("result")}>
                        <div className="flex items-center justify-center gap-1 hover:text-foreground">
                          Resultado
                          {sortFieldGeneral === "result" ? (
                            sortOrderGeneral === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />
                          ) : <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />}
                        </div>
                      </th>
                      <th className="p-3 cursor-pointer select-none" onClick={() => handleSortGeneral("date")}>
                        <div className="flex items-center gap-1 hover:text-foreground">
                          Fecha
                          {sortFieldGeneral === "date" ? (
                            sortOrderGeneral === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />
                          ) : <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-foreground">
                    {pagedGeneral.map((item) => {
                      const resObj = item.result && !Array.isArray(item.result) ? item.result : item.result?.[0] || null;
                      return (
                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-foreground">{item.collaborator?.full_name || "Desconocido"}</div>
                            <div className="text-[11px] text-muted-foreground">{item.collaborator?.document_number || "—"}</div>
                          </td>
                          <td className="p-3 text-muted-foreground">{item.collaborator?.positions?.name || item.collaborator?.position?.name || "—"}</td>
                          <td className="p-3 text-muted-foreground">{item.collaborator?.areas?.name || item.collaborator?.area?.name || "—"}</td>
                          <td className="p-3 text-muted-foreground">
                            {item.evaluator ? `${item.evaluator.first_name} ${item.evaluator.last_name}` : "—"}
                          </td>
                          <td className="p-3 text-center font-bold text-sm">
                            {resObj ? formatScore(resObj.overall_average) : "—"}
                          </td>
                          <td className="p-3 text-center">
                            {resObj ? (
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getResultColor(resObj.result)}`}>
                                {getResultLabel(resObj.result)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border bg-muted text-muted-foreground">
                                Pendiente
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {item.finalized_at
                              ? new Date(item.finalized_at).toLocaleDateString("es-ES")
                              : new Date(item.created_at).toLocaleDateString("es-ES")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                <span>
                  Página {pageGeneral} de {totalPagesGeneral}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={pageGeneral === 1}
                    onClick={() => setPageGeneral((p) => Math.max(p - 1, 1))}
                    className="p-1.5 rounded-lg border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={pageGeneral >= totalPagesGeneral}
                    onClick={() => setPageGeneral((p) => Math.min(p + 1, totalPagesGeneral))}
                    className="p-1.5 rounded-lg border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground border rounded-xl bg-muted/10">
              No se encontraron evaluaciones con los filtros seleccionados.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MÓDULO 2: VISTA SEGUIMIENTO PMI                                            */}
      {/* ========================================================================= */}
      {activeReport === "pmi" && (
        <div className="rounded-b-2xl border border-t-0 bg-card p-5 sm:p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-warning-600" />
                Filtros: Seguimiento a Planes de Mejoramiento (PMI)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Supervisa los colaboradores con calificaciones menores a 3.1 o con condición de PMI requerido
              </p>
            </div>
            <button
              onClick={handleExportPMI}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-warning-200 bg-warning-50 text-warning-700 hover:bg-warning-100 dark:bg-warning-950/30 dark:border-warning-800 dark:text-warning-300 text-xs font-semibold transition-colors self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar PMI (Excel)
            </button>
          </div>

          {/* PMI Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Buscar Colaborador / Cargo</label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchPmi}
                  onChange={(e) => {
                    setSearchPmi(e.target.value);
                    setPagePmi(1);
                  }}
                  placeholder="Nombre o cargo..."
                  className="w-full h-[38px] pl-8 pr-2.5 rounded-xl border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <MultiSelectSearch
                options={areas}
                selectedValues={selectedAreasPmi}
                onChange={(vals) => {
                  setSelectedAreasPmi(vals);
                  setPagePmi(1);
                }}
                placeholder="Todas las áreas"
                searchPlaceholder="Buscar área..."
                label="Área"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Condición de PMI</label>
              <select
                value={pmiResultFilter}
                onChange={(e) => {
                  setPmiResultFilter(e.target.value);
                  setPagePmi(1);
                }}
                className="w-full h-[38px] mt-1 px-2.5 rounded-xl border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Todos los casos PMI</option>
                <option value="plan_mejoramiento">Plan de Mejoramiento (3.1 a 3.4)</option>
                <option value="no_aprobado">No Aprobado (Menor a 3.1)</option>
              </select>
            </div>
          </div>

          {/* PMI Results Table */}
          {filteredPmi.length > 0 ? (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b text-muted-foreground uppercase font-semibold">
                      <th className="p-3">Colaborador</th>
                      <th className="p-3">Cargo</th>
                      <th className="p-3">Área</th>
                      <th className="p-3 text-center">Puntaje</th>
                      <th className="p-3 text-center">Condición</th>
                      <th className="p-3">Fecha Evaluación</th>
                      <th className="p-3 text-center">Estado Seguimiento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-foreground">
                    {pagedPmi.map((item) => {
                      const collab = item.evaluation?.collaborator;
                      return (
                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-semibold text-foreground">{collab?.full_name || "Desconocido"}</td>
                          <td className="p-3 text-muted-foreground">{collab?.positions?.name || "—"}</td>
                          <td className="p-3 text-muted-foreground">{collab?.areas?.name || "—"}</td>
                          <td className="p-3 text-center font-bold text-sm">
                            {item.overall_average ? formatScore(item.overall_average) : "—"}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getResultColor(item.result)}`}>
                              {getResultLabel(item.result)}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString("es-ES") : "—"}
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-warning-50 text-warning-700 border border-warning-200">
                              <AlertTriangle className="w-3 h-3" />
                              Compromiso Activo
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                <span>
                  Página {pagePmi} de {totalPagesPmi} ({filteredPmi.length} casos encontrados)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={pagePmi === 1}
                    onClick={() => setPagePmi((p) => Math.max(p - 1, 1))}
                    className="p-1.5 rounded-lg border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={pagePmi >= totalPagesPmi}
                    onClick={() => setPagePmi((p) => Math.min(p + 1, totalPagesPmi))}
                    className="p-1.5 rounded-lg border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground border rounded-xl bg-muted/10">
              No se encontraron registros de planes de mejoramiento con los criterios actuales.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MÓDULO 3: VISTA EVALUACIONES POR LÍDER (INFORME SOLICITADO)                */}
      {/* ========================================================================= */}
      {activeReport === "lideres" && (
        <div className="rounded-b-2xl border border-t-0 bg-card p-5 sm:p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Informe de Gestión y Evaluaciones por Líder
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monitorea el avance de evaluaciones realizadas por cada líder y detecta quiénes aún no han evaluado a su personal
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportLeadersExcel(filteredLeaders, true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-300 text-xs font-semibold transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Exportar Vista Actual (Excel)
              </button>
              <button
                onClick={() => handleExportLeadersExcel(leadersData, false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow hover:bg-indigo-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar Informe Completo
              </button>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border bg-background/60 shadow-xs">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
                <Users className="w-4 h-4 text-indigo-500" />
                Total Líderes
              </div>
              <div className="text-2xl font-bold text-foreground">{leadersSummary.totalLeaders}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Registrados con rol Líder</div>
            </div>

            <div className="p-3.5 rounded-xl border bg-success-50/30 border-success-200/60 dark:bg-success-950/10 shadow-xs">
              <div className="flex items-center gap-2 text-success-700 dark:text-success-300 text-xs font-semibold mb-1">
                <CheckCircle className="w-4 h-4 text-success-600" />
                Con Evaluaciones
              </div>
              <div className="text-2xl font-bold text-success-700 dark:text-success-300">
                {leadersSummary.leadersWithEvaluations}
              </div>
              <div className="text-[11px] text-success-600/90 dark:text-success-400 mt-0.5">
                {leadersSummary.completionPercentage}% de participación
              </div>
            </div>

            <div className="p-3.5 rounded-xl border bg-danger-50/40 border-danger-200/60 dark:bg-danger-950/15 shadow-xs">
              <div className="flex items-center gap-2 text-danger-700 dark:text-danger-300 text-xs font-semibold mb-1">
                <AlertCircle className="w-4 h-4 text-danger-600" />
                Sin Evaluaciones Realizadas
              </div>
              <div className="text-2xl font-bold text-danger-700 dark:text-danger-300">
                {leadersSummary.leadersWithoutEvaluations}
              </div>
              <div className="text-[11px] text-danger-600/90 dark:text-danger-400 mt-0.5">
                Requieren seguimiento prioritario
              </div>
            </div>

            <div className="p-3.5 rounded-xl border bg-background/60 shadow-xs">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
                <FileSpreadsheet className="w-4 h-4 text-brand-500" />
                Evaluaciones Totales
              </div>
              <div className="text-2xl font-bold text-foreground">{leadersSummary.totalEvaluations}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Gestionadas por líderes</div>
            </div>
          </div>

          {/* Leaders Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Buscar por Nombre o Correo</label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchLeader}
                  onChange={(e) => {
                    setSearchLeader(e.target.value);
                    setPageLeaders(1);
                  }}
                  placeholder="Nombre de líder o correo..."
                  className="w-full h-[38px] pl-8 pr-2.5 rounded-xl border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Estado de Cumplimiento</label>
              <select
                value={leaderStatusFilter}
                onChange={(e) => {
                  setLeaderStatusFilter(e.target.value as any);
                  setPageLeaders(1);
                }}
                className="w-full h-[38px] mt-1 px-2.5 rounded-xl border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">Todos los Líderes ({leadersData.length})</option>
                <option value="with_evals">✅ Con Evaluaciones Realizadas ({leadersSummary.leadersWithEvaluations})</option>
                <option value="without_evals">⚠️ Sin Evaluaciones Realizadas ({leadersSummary.leadersWithoutEvaluations})</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Ordenar Por</label>
              <select
                value={leaderSortOrder}
                onChange={(e) => {
                  setLeaderSortOrder(e.target.value as any);
                  setPageLeaders(1);
                }}
                className="w-full h-[38px] mt-1 px-2.5 rounded-xl border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="evals_desc">Mayor cantidad de evaluaciones</option>
                <option value="evals_asc">Menor cantidad de evaluaciones</option>
                <option value="name_asc">Nombre Alfabético (A - Z)</option>
                <option value="name_desc">Nombre Alfabético (Z - A)</option>
                <option value="score_desc">Calificación promedio otorgada</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {filteredLeaders.length > 0 ? (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b text-muted-foreground uppercase font-semibold">
                      <th className="p-3">Líder / Jefe Evaluador</th>
                      <th className="p-3 text-center">Estado de Gestión</th>
                      <th className="p-3 text-center">Evaluaciones Realizadas</th>
                      <th className="p-3 text-center">Finalizadas</th>
                      <th className="p-3 text-center">Pendientes Firma</th>
                      <th className="p-3 text-center">Promedio Otorgado</th>
                      <th className="p-3">Última Evaluación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-foreground">
                    {pagedLeaders.map((leader) => {
                      return (
                        <tr
                          key={leader.id}
                          className={cn(
                            "hover:bg-muted/20 transition-colors",
                            leader.totalEvaluations === 0 && "bg-danger-50/10"
                          )}
                        >
                          <td className="p-3">
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              {leader.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-muted-foreground/70" />
                              {leader.email}
                            </div>
                          </td>

                          <td className="p-3 text-center">
                            {leader.totalEvaluations > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-success-50 text-success-700 border border-success-200 dark:bg-success-950/30 dark:border-success-800 dark:text-success-300">
                                <CheckCircle className="w-3 h-3" />
                                Activo ({leader.totalEvaluations} evd)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-danger-50 text-danger-700 border border-danger-200 dark:bg-danger-950/40 dark:border-danger-800 dark:text-danger-300 animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                Sin Evaluaciones (0)
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-center">
                            <span className={cn(
                              "text-sm font-bold",
                              leader.totalEvaluations > 0 ? "text-foreground" : "text-danger-600 font-extrabold"
                            )}>
                              {leader.totalEvaluations}
                            </span>
                          </td>

                          <td className="p-3 text-center text-muted-foreground">
                            {leader.finalizedCount > 0 ? (
                              <span className="font-semibold text-success-600">{leader.finalizedCount}</span>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td className="p-3 text-center text-muted-foreground">
                            {leader.pendingSignatureCount > 0 ? (
                              <span className="font-semibold text-amber-600">{leader.pendingSignatureCount}</span>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td className="p-3 text-center font-semibold">
                            {leader.averageScore > 0 ? (
                              <span className="text-foreground">{leader.averageScore.toFixed(2)}</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>

                          <td className="p-3 text-muted-foreground">
                            {leader.lastEvaluationDate
                              ? new Date(leader.lastEvaluationDate).toLocaleDateString("es-ES")
                              : <span className="text-danger-500 font-medium text-[11px]">Sin registros</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                <span>
                  Mostrando {filteredLeaders.length > 0 ? (pageLeaders - 1) * pageSizeLeaders + 1 : 0} a{" "}
                  {Math.min(pageLeaders * pageSizeLeaders, filteredLeaders.length)} de {filteredLeaders.length} líderes
                  {leaderStatusFilter === "without_evals" && " (filtrados sin evaluaciones)"}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={pageLeaders === 1}
                    onClick={() => setPageLeaders((p) => Math.max(p - 1, 1))}
                    className="p-1.5 rounded-lg border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={pageLeaders >= totalPagesLeaders}
                    onClick={() => setPageLeaders((p) => Math.min(p + 1, totalPagesLeaders))}
                    className="p-1.5 rounded-lg border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground border rounded-xl bg-muted/10">
              No se encontraron líderes con los filtros aplicados.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MÓDULO 4: VISTA RESUMEN EJECUTIVO                                          */}
      {/* ========================================================================= */}
      {activeReport === "ejecutivo" && (
        <div className="rounded-b-2xl border border-t-0 bg-card p-5 sm:p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600" />
                Módulo: Resumen Ejecutivo Gerencial
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Consolidado de desempeño general y desgloses de competencias por área corporativa
              </p>
            </div>
            <button
              onClick={handleExportExecutivePDF}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl gradient-brand text-white text-xs font-semibold shadow hover:opacity-90 transition-opacity"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar PDF Oficial
            </button>
          </div>

          {/* Filters for executive view */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Filtrar por Área Específica</label>
              <select
                value={selectedExecutiveArea}
                onChange={(e) => setSelectedExecutiveArea(e.target.value)}
                className="w-full h-[38px] mt-1 px-2.5 rounded-xl border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Todas las Áreas de la Empresa</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Periodo de Evaluación</label>
              <input
                type="text"
                disabled
                value="Vigencia 2026 · Flota Sugamuxi S.A."
                className="w-full h-[38px] mt-1 px-2.5 rounded-xl border bg-muted text-xs text-muted-foreground font-medium"
              />
            </div>
          </div>

          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-xl border bg-background shadow-xs">
              <span className="text-xs text-muted-foreground font-medium">Total Evaluaciones</span>
              <div className="text-2xl font-bold mt-1 text-foreground">{executiveData.total}</div>
              <span className="text-[11px] text-muted-foreground">En el corte actual</span>
            </div>

            <div className="p-4 rounded-xl border bg-background shadow-xs">
              <span className="text-xs text-muted-foreground font-medium">Promedio General</span>
              <div className="text-2xl font-bold mt-1 text-brand-600">{executiveData.average} / 5.0</div>
              <span className="text-[11px] text-muted-foreground">Calificación promedio</span>
            </div>

            <div className="p-4 rounded-xl border bg-background shadow-xs">
              <span className="text-xs text-muted-foreground font-medium">Tasa de Aprobación</span>
              <div className="text-2xl font-bold mt-1 text-success-600">{executiveData.approvalRate}%</div>
              <span className="text-[11px] text-muted-foreground">{executiveData.approved} colaboradores</span>
            </div>

            <div className="p-4 rounded-xl border bg-background shadow-xs">
              <span className="text-xs text-muted-foreground font-medium">Requieren PMI</span>
              <div className="text-2xl font-bold mt-1 text-warning-600">{executiveData.pmi + executiveData.notApproved}</div>
              <span className="text-[11px] text-muted-foreground">{executiveData.pmi} en plan + {executiveData.notApproved} no aprobados</span>
            </div>
          </div>

          {/* Area & Category summaries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* Area Table */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-foreground">Desempeño Promedio por Área</h4>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b text-muted-foreground font-semibold uppercase">
                    <tr>
                      <th className="p-2.5">Área</th>
                      <th className="p-2.5 text-center">Evaluaciones</th>
                      <th className="p-2.5 text-center">Promedio</th>
                      <th className="p-2.5 text-center">% Aprobación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-foreground">
                    {Object.entries(executiveData.areaStats).map(([name, stat]) => (
                      <tr key={name} className="hover:bg-muted/20">
                        <td className="p-2.5 font-medium">{name}</td>
                        <td className="p-2.5 text-center text-muted-foreground">{stat.total}</td>
                        <td className="p-2.5 text-center font-bold">{(stat.sum / stat.total).toFixed(2)}</td>
                        <td className="p-2.5 text-center font-semibold text-success-600">
                          {((stat.approved / stat.total) * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Table */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-foreground">Calificación por Categoría de Competencias</h4>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b text-muted-foreground font-semibold uppercase">
                    <tr>
                      <th className="p-2.5">Categoría</th>
                      <th className="p-2.5 text-center">Evaluaciones</th>
                      <th className="p-2.5 text-center">Promedio Obtenido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-foreground">
                    {Object.entries(executiveData.catStats).map(([name, stat]) => (
                      <tr key={name} className="hover:bg-muted/20">
                        <td className="p-2.5 font-medium">{name}</td>
                        <td className="p-2.5 text-center text-muted-foreground">{stat.count}</td>
                        <td className="p-2.5 text-center font-bold text-brand-600">{(stat.sum / stat.count).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
