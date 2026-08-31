"use client";

import React, { useEffect, useState } from "react";
import { FileBarChart2, Download, FileSpreadsheet, FileText, Filter, TrendingUp, Search, Loader2, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { getAreas, getPositions } from "@/app/actions/config";
import { getEvaluations } from "@/app/actions/evaluations";
import MultiSelectSearch from "@/components/ui/MultiSelectSearch";
import { getPMIs } from "@/app/actions/pmi";
import { formatScore, getResultLabel, getResultColor, compressImageIfNeeded } from "@/lib/utils";
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
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<EvaluationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const [sortField, setSortField] = useState<string>("collaborator");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedFiltered = [...filteredEvaluations].sort((a, b) => {
    let valA: any;
    let valB: any;

    if (sortField === "collaborator") {
      valA = (a.collaborator?.full_name || "").toLowerCase();
      valB = (b.collaborator?.full_name || "").toLowerCase();
    } else if (sortField === "position") {
      valA = (a.collaborator?.position?.name || "").toLowerCase();
      valB = (b.collaborator?.position?.name || "").toLowerCase();
    } else if (sortField === "area") {
      valA = (a.collaborator?.areas?.name || "").toLowerCase();
      valB = (b.collaborator?.areas?.name || "").toLowerCase();
    } else if (sortField === "score") {
      const resA = a.result && !Array.isArray(a.result) ? a.result : a.result?.[0] || null;
      const resB = b.result && !Array.isArray(b.result) ? b.result : b.result?.[0] || null;
      valA = resA ? Number(resA.overall_average) || 0 : 0;
      valB = resB ? Number(resB.overall_average) || 0 : 0;
    } else if (sortField === "result") {
      const resA = a.result && !Array.isArray(a.result) ? a.result : a.result?.[0] || null;
      const resB = b.result && !Array.isArray(b.result) ? b.result : b.result?.[0] || null;
      valA = resA ? (resA.result || "").toLowerCase() : "";
      valB = resB ? (resB.result || "").toLowerCase() : "";
    } else if (sortField === "evaluator") {
      valA = a.evaluator ? `${a.evaluator.first_name} ${a.evaluator.last_name}`.toLowerCase() : "";
      valB = b.evaluator ? `${b.evaluator.first_name} ${b.evaluator.last_name}`.toLowerCase() : "";
    } else if (sortField === "date") {
      valA = a.finalized_at ? new Date(a.finalized_at).getTime() : a.created_at ? new Date(a.created_at).getTime() : 0;
      valB = b.finalized_at ? new Date(b.finalized_at).getTime() : b.created_at ? new Date(b.created_at).getTime() : 0;
    }

    if (valA === undefined || valA === null) return 1;
    if (valB === undefined || valB === null) return -1;

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Filters
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedResult, setSelectedResult] = useState("");
  const [startDate, setStartDate] = useState("");

  useEffect(() => {
    async function loadData() {
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

        const [areasData, positionsData, evalsRes] = await Promise.all([
          getAreas(),
          getPositions(),
          getEvaluations()
        ]);
        
        setAreas(areasData || []);
        setPositions(positionsData || []);
        if (evalsRes.data) {
          let loadedEvals = evalsRes.data as any[];
          if (roleName === "lider") {
            loadedEvals = loadedEvals.filter(item => item.evaluator_id === uid);
          }
          setEvaluations(loadedEvals);
          setFilteredEvaluations(loadedEvals);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Error al cargar la información inicial");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearch = () => {
    setIsSearching(true);
    let results = [...evaluations];

    // Filter by Area Name (multiple selections)
    if (selectedAreas.length > 0) {
      results = results.filter((item) => {
        const areaName = item.collaborator?.areas?.name || item.collaborator?.area?.name || "";
        return selectedAreas.includes(areaName);
      });
    }

    // Filter by Cargo Name (multiple selections)
    if (selectedPositions.length > 0) {
      results = results.filter((item) => {
        const positionName = item.collaborator?.positions?.name || item.collaborator?.position?.name || "";
        return selectedPositions.includes(positionName);
      });
    }

    // Filter by Result
    if (selectedResult) {
      results = results.filter((item) => {
        const resObj = item.result && !Array.isArray(item.result)
          ? item.result
          : item.result?.[0] || null;
        return resObj?.result === selectedResult;
      });
    }

    // Filter by Start Date
    if (startDate) {
      const searchDate = new Date(startDate);
      results = results.filter((item) => {
        const itemDate = new Date(item.finalized_at || item.created_at);
        return itemDate >= searchDate;
      });
    }

    setFilteredEvaluations(results);
    setIsSearching(false);
    toast.success(`Búsqueda completa: ${results.length} resultados encontrados`);
  };

  // Export Excel: Consolidado General
  const handleExportConsolidado = async () => {
    if (evaluations.length === 0) {
      toast.error("No hay evaluaciones disponibles para exportar");
      return;
    }

    const toastId = toast.loading("Generando Excel consolidado...");
    try {
      // 1. Get all unique category names dynamically
      const uniqueCategories = new Set<string>();
      evaluations.forEach((item) => {
        const resObj = item.result && !Array.isArray(item.result)
          ? item.result
          : item.result?.[0] || null;
        if (resObj && resObj.category_scores) {
          const cats = Array.isArray(resObj.category_scores)
            ? resObj.category_scores
            : Object.values(resObj.category_scores);
          cats.forEach((cat: any) => {
            if (cat?.name) {
              uniqueCategories.add(cat.name);
            }
          });
        }
      });
      const categoriesList = Array.from(uniqueCategories).sort();

      // 2. Generate rows for Collaborator tab
      const collaboratorRows = evaluations.map((item) => {
        const resObj = item.result && !Array.isArray(item.result)
          ? item.result
          : item.result?.[0] || null;
        
        const row: Record<string, any> = {
          "ID Evaluación": item.code || "—",
          "Colaborador": item.collaborator?.full_name || "N/A",
          "Documento": item.collaborator?.document_number || "N/A",
          "Área": item.collaborator?.areas?.name || item.collaborator?.area?.name || "N/A",
          "Cargo": item.collaborator?.positions?.name || item.collaborator?.position?.name || "N/A",
          "Evaluador": item.evaluator ? `${item.evaluator.first_name} ${item.evaluator.last_name}` : "N/A",
          "Antigüedad": isEvdRequired(item.collaborator?.hire_date) ? "Requerido" : "No Requerido",
          "EVD 2026": (item.finalized_at || (item as any).status === "finalizada") ? "Realizada" : "Pendiente",
          "Fecha de Finalización": item.finalized_at ? new Date(item.finalized_at).toLocaleDateString("es-ES") : "Pendiente",
        };

        // Add dynamic category averages
        const cats = resObj?.category_scores
          ? (Array.isArray(resObj.category_scores) ? resObj.category_scores : Object.values(resObj.category_scores))
          : [];

        categoriesList.forEach((catName) => {
          let scoreVal: any = "—";
          if (resObj && cats.length > 0) {
            const catMatch = cats.find((c: any) => c.name === catName) as any;
            if (catMatch && catMatch.average !== undefined) {
              scoreVal = Number(formatScore(catMatch.average));
            } else if (catMatch && catMatch.score !== undefined) {
              scoreVal = Number(formatScore(catMatch.score));
            }
          }
          row[`Promedio Cat: ${catName}`] = scoreVal;
        });

        // Add general overall average and final result status
        row["Promedio General"] = resObj ? Number(formatScore(resObj.overall_average)) : "Pendiente";
        row["Resultado EVD"] = resObj ? getResultLabel(resObj.result) : "Pendiente";

        return row;
      });

      // 3. Generate rows for Area tab
      const areaDataMap: Record<string, {
        name: string;
        totalEvaluated: number;
        categorySums: Record<string, number>;
        categoryCounts: Record<string, number>;
        overallSum: number;
        overallCount: number;
        aprobadosCount: number;
      }> = {};

      evaluations.forEach((item) => {
        const resObj = item.result && !Array.isArray(item.result)
          ? item.result
          : item.result?.[0] || null;
        
        const areaName = item.collaborator?.areas?.name || item.collaborator?.area?.name || "Sin Área";
        
        if (!areaDataMap[areaName]) {
          areaDataMap[areaName] = {
            name: areaName,
            totalEvaluated: 0,
            categorySums: {},
            categoryCounts: {},
            overallSum: 0,
            overallCount: 0,
            aprobadosCount: 0
          };
        }

        const areaStat = areaDataMap[areaName];

        if (resObj) {
          areaStat.totalEvaluated++;
          areaStat.overallSum += Number(resObj.overall_average) || 0;
          areaStat.overallCount++;
          if (resObj.result === "aprobado") {
            areaStat.aprobadosCount++;
          }

          const cats = resObj.category_scores
            ? (Array.isArray(resObj.category_scores) ? resObj.category_scores : Object.values(resObj.category_scores))
            : [];

          cats.forEach((cat: any) => {
            if (cat?.name && (cat.average !== undefined || cat.score !== undefined)) {
              const catName = cat.name;
              const val = cat.average !== undefined ? cat.average : cat.score;
              if (!areaStat.categorySums[catName]) {
                areaStat.categorySums[catName] = 0;
                areaStat.categoryCounts[catName] = 0;
              }
              areaStat.categorySums[catName] += Number(val) || 0;
              areaStat.categoryCounts[catName]++;
            }
          });
        }
      });

      const areaRows = Object.values(areaDataMap).map((areaStat) => {
        const row: Record<string, any> = {
          "Área": areaStat.name,
          "Colaboradores Evaluados": areaStat.totalEvaluated,
        };

        // Add average score per category in this area
        categoriesList.forEach((catName) => {
          const sum = areaStat.categorySums[catName] || 0;
          const count = areaStat.categoryCounts[catName] || 0;
          row[`Promedio Cat: ${catName}`] = count > 0 ? Number(formatScore(sum / count)) : "—";
        });

        // Add overall area general average score and approval %
        row["Promedio General Área"] = areaStat.overallCount > 0 ? Number(formatScore(areaStat.overallSum / areaStat.overallCount)) : 0;
        row["% Aprobación"] = areaStat.overallCount > 0 ? `${((areaStat.aprobadosCount / areaStat.overallCount) * 100).toFixed(0)}%` : "0%";

        return row;
      });

      // 4. Generate rows for Category tab
      const catSummaryMap: Record<string, { sum: number; count: number }> = {};
      evaluations.forEach((item) => {
        const resObj = item.result && !Array.isArray(item.result)
          ? item.result
          : item.result?.[0] || null;
        if (resObj && resObj.category_scores) {
          const cats = Array.isArray(resObj.category_scores)
            ? resObj.category_scores
            : Object.values(resObj.category_scores);
          cats.forEach((cat: any) => {
            if (cat?.name && (cat.average !== undefined || cat.score !== undefined)) {
              const catName = cat.name;
              const val = cat.average !== undefined ? cat.average : cat.score;
              if (!catSummaryMap[catName]) {
                catSummaryMap[catName] = { sum: 0, count: 0 };
              }
              catSummaryMap[catName].sum += Number(val) || 0;
              catSummaryMap[catName].count++;
            }
          });
        }
      });

      const categoryRows = Object.entries(catSummaryMap).map(([catName, stat]) => ({
        "Categoría": catName,
        "Evaluaciones Registradas": stat.count,
        "Promedio General Obtenido": stat.count > 0 ? Number(formatScore(stat.sum / stat.count)) : 0
      }));

      // 5. Create workbook and add sheets
      const workbook = XLSX.utils.book_new();

      const worksheetCollab = XLSX.utils.json_to_sheet(collaboratorRows);
      XLSX.utils.book_append_sheet(workbook, worksheetCollab, "Resultados por Colaborador");

      const worksheetArea = XLSX.utils.json_to_sheet(areaRows);
      XLSX.utils.book_append_sheet(workbook, worksheetArea, "Resultados por Área");

      if (categoryRows.length > 0) {
        const worksheetCat = XLSX.utils.json_to_sheet(categoryRows);
        XLSX.utils.book_append_sheet(workbook, worksheetCat, "Resultados por Categoría");
      }

      // Auto-fit column widths for sheets
      const setColWidths = (ws: XLSX.WorkSheet, rows: any[]) => {
        if (!rows || rows.length === 0) return;
        const maxColWidth = rows.reduce((acc, row) => {
          Object.keys(row).forEach((key, i) => {
            const val = String((row as any)[key] ?? "");
            acc[i] = Math.max(acc[i] || 10, val.length + 2, key.length + 2);
          });
          return acc;
        }, [] as number[]);
        ws["!cols"] = maxColWidth.map((w: number) => ({ wch: w }));
      };

      setColWidths(worksheetCollab, collaboratorRows);
      setColWidths(worksheetArea, areaRows);
      if (categoryRows.length > 0) {
        const wsCat = workbook.Sheets["Resultados por Categoría"];
        if (wsCat) setColWidths(wsCat, categoryRows);
      }

      XLSX.writeFile(workbook, `Reporte_Consolidado_EVD_${new Date().getFullYear()}.xlsx`);
      toast.success("Excel Consolidado descargado exitosamente", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Error al exportar a Excel", { id: toastId });
    }
  };

  // Export Excel: Seguimiento PMI
  const handleExportPMI = async () => {
    const toastId = toast.loading("Generando reporte de PMI...");
    try {
      const res = await getPMIs();
      if (res.error || !res.data) {
        toast.error("Error al obtener los datos de PMI", { id: toastId });
        return;
      }

      if (res.data.length === 0) {
        toast.error("No hay planes de mejoramiento (PMI) registrados", { id: toastId });
        return;
      }

      let pmiData = res.data || [];
      if (currentUserRole === "lider" && currentUserId) {
        pmiData = pmiData.filter((pmi: any) => pmi.evaluation?.evaluator_id === currentUserId);
      }

      if (pmiData.length === 0) {
        toast.error("No tienes planes de mejoramiento (PMI) asociados a tus evaluaciones", { id: toastId });
        return;
      }

      const excelRows = pmiData.map((pmi: any) => {
        const collab = pmi.evaluation?.collaborator;
        return {
          "ID PMI": pmi.id,
          "Colaborador": collab?.full_name || "N/A",
          "Cargo": collab?.positions?.name || "N/A",
          "Área": collab?.areas?.name || "N/A",
          "Puntaje Evaluado": pmi.overall_average || 0,
          "Estado de Plan": pmi.pmi_status ? pmi.pmi_status.toUpperCase() : "ACTIVO",
          "Fecha Finalización Eval": pmi.finalized_at ? new Date(pmi.finalized_at).toLocaleDateString("es-ES") : "N/A",
          "Vencimiento 30 Días": pmi.pmi_due_date_30 ? new Date(pmi.pmi_due_date_30).toLocaleDateString("es-ES") : "N/A",
          "Vencimiento 60 Días": pmi.pmi_due_date_60 ? new Date(pmi.pmi_due_date_60).toLocaleDateString("es-ES") : "N/A",
          "Vencimiento 90 Días": pmi.pmi_due_date_90 ? new Date(pmi.pmi_due_date_90).toLocaleDateString("es-ES") : "N/A",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "PMI Tracking");

      const maxColWidth = excelRows.reduce((acc, row) => {
        Object.keys(row).forEach((key, i) => {
          const val = String((row as any)[key]);
          acc[i] = Math.max(acc[i] || 10, val.length + 2, key.length + 2);
        });
        return acc;
      }, [] as number[]);
      worksheet["!cols"] = maxColWidth.map(w => ({ wch: w }));

      XLSX.writeFile(workbook, `Seguimiento_PMI_EVD_${new Date().getFullYear()}.xlsx`);
      toast.success("Excel PMI descargado exitosamente", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Error al exportar reporte de PMI", { id: toastId });
    }
  };

  // Export PDF: Resumen Ejecutivo
  const handleExportExecutivePDF = async () => {
    if (evaluations.length === 0) {
      toast.error("No hay evaluaciones disponibles para generar el PDF");
      return;
    }

    const toastId = toast.loading("Generando Resumen Ejecutivo PDF...");
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const brandColorBlue = [1, 33, 105]; // #012169
      const brandColorLightBlue = [0, 132, 213]; // #0084D5
      const textColorDark = [30, 41, 59]; // #1e293b
      const textColorMuted = [100, 116, 139]; // #64748b
      const marginX = 15;

      // Load logo image first
      let logoImg: HTMLImageElement | null = null;
      try {
        const logoSrc = await compressImageIfNeeded("/logo.png", 200, 200);
        logoImg = await new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image();
          img.src = logoSrc;
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        });
      } catch {
        // Ignore logo loading error
      }

      let textStartX = marginX;
      if (logoImg) {
        doc.addImage(logoImg, "PNG", marginX, 6, 13, 13);
        textStartX = marginX + 16;
      }

      // Title header
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

      // Document Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(brandColorBlue[0], brandColorBlue[1], brandColorBlue[2]);
      doc.text("RESUMEN EJECUTIVO DE DESEMPEÑO EVD", marginX, 32);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString("es-ES")}`, marginX, 38);

      // Calculations
      const total = evaluations.length;
      let scoreSum = 0;
      let approvedCount = 0;
      let pmiCount = 0;
      let noApprovedCount = 0;

      const areaStats: Record<string, { total: number; sum: number }> = {};
      const catStats: Record<string, { total: number; sum: number; count: number }> = {};

      evaluations.forEach((item) => {
        const resObj = item.result && !Array.isArray(item.result)
          ? item.result
          : item.result?.[0] || null;
        
        if (resObj) {
          const score = Number(resObj.overall_average) || 0;
          scoreSum += score;

          if (resObj.result === "aprobado") approvedCount++;
          else if (resObj.result === "plan_mejoramiento") pmiCount++;
          else if (resObj.result === "no_aprobado") noApprovedCount++;

          const areaName = item.collaborator?.areas?.name || item.collaborator?.area?.name || "Sin Área";
          if (!areaStats[areaName]) areaStats[areaName] = { total: 0, sum: 0 };
          areaStats[areaName].total++;
          areaStats[areaName].sum += score;

          if (resObj.category_scores) {
            const cats = Array.isArray(resObj.category_scores)
              ? resObj.category_scores
              : Object.values(resObj.category_scores);
            cats.forEach((cat: any) => {
              if (cat?.name && (cat.average !== undefined || cat.score !== undefined)) {
                const catName = cat.name;
                const val = cat.average !== undefined ? cat.average : cat.score;
                if (!catStats[catName]) catStats[catName] = { total: 0, sum: 0, count: 0 };
                catStats[catName].sum += Number(val) || 0;
                catStats[catName].count++;
              }
            });
          }
        }
      });

      const avgGeneral = total > 0 ? (scoreSum / total).toFixed(2) : "0.00";
      const approvalRate = total > 0 ? ((approvedCount / total) * 100).toFixed(0) : "0";

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

      doc.text(`Total Evaluaciones Realizadas: ${total}`, marginX + 5, currentY + 15);
      doc.text(`Promedio General Obtenido: ${avgGeneral} / 5.0`, marginX + 5, currentY + 22);
      doc.text(`Tasa Global de Aprobación: ${approvalRate}%`, marginX + 5, currentY + 28);

      doc.text(`Evaluaciones Aprobadas: ${approvedCount}`, marginX + 95, currentY + 15);
      doc.text(`Con Plan de Mejoramiento (PMI): ${pmiCount}`, marginX + 95, currentY + 22);
      doc.text(`No Aprobados: ${noApprovedCount}`, marginX + 95, currentY + 28);

      currentY += 40;

      // 2. Area breakdown table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
      doc.text("2. DESEMPEÑO PROMEDIO POR ÁREA", marginX, currentY);
      currentY += 4;

      const areaHeaders = [["Área de la Empresa", "Total Evaluaciones", "Promedio General"]];
      const areaRows = Object.entries(areaStats).map(([name, stat]) => [
        name,
        stat.total.toString(),
        `${(stat.sum / stat.total).toFixed(2)} / 5.0`
      ]);

      autoTable(doc, {
        startY: currentY,
        head: areaHeaders,
        body: areaRows,
        theme: "striped",
        headStyles: { fillColor: brandColorBlue as any, textColor: [255, 255, 255] as any, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2, textColor: textColorDark as any },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 100 },
          1: { cellWidth: 40, halign: "center" },
          2: { cellWidth: 40, halign: "center" }
        },
        margin: { left: marginX, right: marginX, top: 26, bottom: 24 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      if (currentY > 210) {
        doc.addPage();
        currentY = 28;
      }

      // 3. Category table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
      doc.text("3. CALIFICACIÓN PROMEDIO POR CATEGORÍA", marginX, currentY);
      currentY += 4;

      const catHeaders = [["Categoría", "Calificación Promedio"]];
      const catRows = Object.entries(catStats).map(([name, stat]) => [
        name,
        `${(stat.sum / stat.count).toFixed(2)} / 5.0`
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
          1: { cellWidth: 60, halign: "center" }
        },
        margin: { left: marginX, right: marginX, top: 26, bottom: 24 }
      });

      // Page loop for header and footer drawings
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        doc.setFillColor(brandColorBlue[0], brandColorBlue[1], brandColorBlue[2]);
        doc.rect(0, 0, 210, 4, "F");

        if (logoImg) {
          doc.addImage(logoImg, "PNG", marginX, 6, 13, 13);
        }

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

        // Footer
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
        doc.text(`Generado el: ${new Date().toLocaleDateString("es-ES")}`, marginX, 285);
        doc.text(`Página ${i} de ${totalPages}`, 210 - marginX, 285, { align: "right" });
        doc.line(marginX, 280, 210 - marginX, 280);
      }

      doc.save(`Resumen_Ejecutivo_EVD_${new Date().getFullYear()}.pdf`);
      toast.success("Resumen Ejecutivo PDF generado exitosamente", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Error al generar el PDF del Resumen Ejecutivo", { id: toastId });
    }
  };

  // Export Excel for Filtered Data with Category and Area breakdowns
  const handleExportFilteredExcel = () => {
    if (filteredEvaluations.length === 0) {
      toast.error("No hay resultados de búsqueda para exportar");
      return;
    }

    const toastId = toast.loading("Exportando resultados filtrados...");
    try {
      // 1. Get all unique category names dynamically from filtered evaluations
      const uniqueCategories = new Set<string>();
      filteredEvaluations.forEach((item) => {
        const resObj = item.result && !Array.isArray(item.result)
          ? item.result
          : item.result?.[0] || null;
        if (resObj && resObj.category_scores) {
          const cats = Array.isArray(resObj.category_scores)
            ? resObj.category_scores
            : Object.values(resObj.category_scores);
          cats.forEach((cat: any) => {
            if (cat?.name) {
              uniqueCategories.add(cat.name);
            }
          });
        }
      });
      const categoriesList = Array.from(uniqueCategories).sort();

      // 2. Tab 1: Detailed Collaborator Results with Category Columns
      const collaboratorRows = filteredEvaluations.map((item) => {
        const resObj = item.result && !Array.isArray(item.result)
          ? item.result
          : item.result?.[0] || null;

        const row: Record<string, any> = {
          "ID Evaluación": item.code || "—",
          "Colaborador": item.collaborator?.full_name || "N/A",
          "Documento": item.collaborator?.document_number || "N/A",
          "Área": item.collaborator?.areas?.name || item.collaborator?.area?.name || "N/A",
          "Cargo": item.collaborator?.positions?.name || item.collaborator?.position?.name || "N/A",
          "Evaluador": item.evaluator ? `${item.evaluator.first_name} ${item.evaluator.last_name}` : "N/A",
          "Fecha Evaluación": item.finalized_at
            ? new Date(item.finalized_at).toLocaleDateString("es-ES")
            : item.created_at
            ? new Date(item.created_at).toLocaleDateString("es-ES")
            : "N/A",
        };

        // Add dynamic category score columns
        const cats = resObj?.category_scores
          ? (Array.isArray(resObj.category_scores) ? resObj.category_scores : Object.values(resObj.category_scores))
          : [];

        categoriesList.forEach((catName) => {
          let scoreVal: any = "—";
          if (resObj && cats.length > 0) {
            const catMatch = cats.find((c: any) => c.name === catName) as any;
            if (catMatch && catMatch.average !== undefined) {
              scoreVal = Number(formatScore(catMatch.average));
            } else if (catMatch && catMatch.score !== undefined) {
              scoreVal = Number(formatScore(catMatch.score));
            }
          }
          row[`Promedio Cat: ${catName}`] = scoreVal;
        });

        row["Puntaje General"] = resObj ? Number(formatScore(resObj.overall_average)) : "Pendiente";
        row["Resultado EVD"] = resObj ? getResultLabel(resObj.result) : "Pendiente";

        return row;
      });

      // 3. Tab 2: Results by Area
      const areaMap: Record<string, {
        name: string;
        totalEvaluated: number;
        categorySums: Record<string, number>;
        categoryCounts: Record<string, number>;
        overallSum: number;
        overallCount: number;
        aprobadosCount: number;
      }> = {};

      filteredEvaluations.forEach((item) => {
        const resObj = item.result && !Array.isArray(item.result)
          ? item.result
          : item.result?.[0] || null;

        const areaName = item.collaborator?.areas?.name || item.collaborator?.area?.name || "Sin Área";

        if (!areaMap[areaName]) {
          areaMap[areaName] = {
            name: areaName,
            totalEvaluated: 0,
            categorySums: {},
            categoryCounts: {},
            overallSum: 0,
            overallCount: 0,
            aprobadosCount: 0
          };
        }

        const areaStat = areaMap[areaName];
        areaStat.totalEvaluated++;

        if (resObj) {
          areaStat.overallSum += Number(resObj.overall_average) || 0;
          areaStat.overallCount++;
          if (resObj.result === "aprobado") {
            areaStat.aprobadosCount++;
          }

          const cats = resObj.category_scores
            ? (Array.isArray(resObj.category_scores) ? resObj.category_scores : Object.values(resObj.category_scores))
            : [];

          cats.forEach((cat: any) => {
            if (cat?.name && (cat.average !== undefined || cat.score !== undefined)) {
              const catName = cat.name;
              const val = cat.average !== undefined ? cat.average : cat.score;
              if (!areaStat.categorySums[catName]) {
                areaStat.categorySums[catName] = 0;
                areaStat.categoryCounts[catName] = 0;
              }
              areaStat.categorySums[catName] += Number(val) || 0;
              areaStat.categoryCounts[catName]++;
            }
          });
        }
      });

      const areaRows = Object.values(areaMap).map((areaStat) => {
        const row: Record<string, any> = {
          "Área": areaStat.name,
          "Total Evaluaciones": areaStat.totalEvaluated,
        };

        categoriesList.forEach((catName) => {
          const sum = areaStat.categorySums[catName] || 0;
          const count = areaStat.categoryCounts[catName] || 0;
          row[`Promedio Cat: ${catName}`] = count > 0 ? Number(formatScore(sum / count)) : "—";
        });

        row["Promedio General Área"] = areaStat.overallCount > 0 ? Number(formatScore(areaStat.overallSum / areaStat.overallCount)) : 0;
        row["% Aprobación"] = areaStat.overallCount > 0 ? `${((areaStat.aprobadosCount / areaStat.overallCount) * 100).toFixed(0)}%` : "0%";

        return row;
      });

      // 4. Tab 3: Results by Category
      const catSummaryMap: Record<string, { sum: number; count: number }> = {};
      filteredEvaluations.forEach((item) => {
        const resObj = item.result && !Array.isArray(item.result)
          ? item.result
          : item.result?.[0] || null;
        if (resObj && resObj.category_scores) {
          const cats = Array.isArray(resObj.category_scores)
            ? resObj.category_scores
            : Object.values(resObj.category_scores);
          cats.forEach((cat: any) => {
            if (cat?.name && (cat.average !== undefined || cat.score !== undefined)) {
              const catName = cat.name;
              const val = cat.average !== undefined ? cat.average : cat.score;
              if (!catSummaryMap[catName]) {
                catSummaryMap[catName] = { sum: 0, count: 0 };
              }
              catSummaryMap[catName].sum += Number(val) || 0;
              catSummaryMap[catName].count++;
            }
          });
        }
      });

      const categoryRows = Object.entries(catSummaryMap).map(([catName, stat]) => ({
        "Categoría": catName,
        "Evaluaciones Registradas": stat.count,
        "Promedio General Obtenido": stat.count > 0 ? Number(formatScore(stat.sum / stat.count)) : 0
      }));

      // 5. Create Workbook and Sheets
      const workbook = XLSX.utils.book_new();

      const wsCollab = XLSX.utils.json_to_sheet(collaboratorRows);
      XLSX.utils.book_append_sheet(workbook, wsCollab, "Resultados Filtrados");

      const wsArea = XLSX.utils.json_to_sheet(areaRows);
      XLSX.utils.book_append_sheet(workbook, wsArea, "Resumen por Área");

      if (categoryRows.length > 0) {
        const wsCat = XLSX.utils.json_to_sheet(categoryRows);
        XLSX.utils.book_append_sheet(workbook, wsCat, "Resumen por Categoría");
      }

      // Auto-fit column widths helper
      const setColWidths = (ws: XLSX.WorkSheet, rows: any[]) => {
        if (!rows || rows.length === 0) return;
        const maxColWidth = rows.reduce((acc, row) => {
          Object.keys(row).forEach((key, i) => {
            const val = String((row as any)[key] ?? "");
            acc[i] = Math.max(acc[i] || 10, val.length + 2, key.length + 2);
          });
          return acc;
        }, [] as number[]);
        ws["!cols"] = maxColWidth.map((w: number) => ({ wch: w }));
      };

      setColWidths(wsCollab, collaboratorRows);
      setColWidths(wsArea, areaRows);
      if (categoryRows.length > 0) {
        const wsCat = workbook.Sheets["Resumen por Categoría"];
        if (wsCat) setColWidths(wsCat, categoryRows);
      }

      XLSX.writeFile(workbook, `Reporte_EVD_Filtrado_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Excel con resultados por área y categoría descargado exitosamente", { id: toastId });
    } catch (error) {
      console.error("Error exporting filtered Excel:", error);
      toast.error("Error al exportar los resultados a Excel", { id: toastId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <p className="text-sm text-muted-foreground font-medium">Cargando reporte de datos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileBarChart2 className="w-6 h-6 text-brand-500" />
            Reportes y Estadísticas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Genera informes consolidados de desempeño y expórtalos en formatos Excel o PDF
          </p>
        </div>
      </div>

      {/* Cards Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* General Consolidated Card */}
        <div 
          onClick={handleExportConsolidado}
          className="p-6 rounded-xl border bg-card hover:shadow-lg transition-all group cursor-pointer relative overflow-hidden border-success-200/50 hover:border-success-500"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform text-success-600">
            <FileSpreadsheet className="w-24 h-24" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-success-50 dark:bg-success-950/30 flex items-center justify-center mb-4 text-success-600 shadow-sm">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-2 text-foreground">Consolidado General (Excel)</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Descarga el reporte detallado con resultados por colaborador y por área, incluyendo desgloses por categoría de competencia y promedio general.
          </p>
          <button className="flex items-center gap-2 text-sm font-semibold text-success-600 hover:text-success-700">
            <Download className="w-4 h-4" />
            Generar Reporte
          </button>
        </div>

        {/* PMI Tracking Card */}
        <div 
          onClick={handleExportPMI}
          className="p-6 rounded-xl border bg-card hover:shadow-lg transition-all group cursor-pointer relative overflow-hidden border-warning-200/50 hover:border-warning-500"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform text-warning-600">
            <TrendingUp className="w-24 h-24" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-warning-50 dark:bg-warning-950/30 flex items-center justify-center mb-4 text-warning-600 shadow-sm">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-2 text-foreground">Seguimiento PMI (Excel)</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Reporte de todos los planes de mejoramiento (PMI) activos, compromisos y fechas límite a 30/60/90 días.
          </p>
          <button className="flex items-center gap-2 text-sm font-semibold text-warning-600 hover:text-warning-700">
            <Download className="w-4 h-4" />
            Generar Reporte
          </button>
        </div>

        {/* Executive Summary Card */}
        <div 
          onClick={handleExportExecutivePDF}
          className="p-6 rounded-xl border bg-card hover:shadow-lg transition-all group cursor-pointer relative overflow-hidden border-brand-200/50 hover:border-brand-500"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform text-brand-600">
            <FileText className="w-24 h-24" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center mb-4 text-brand-600 shadow-sm">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-2 text-foreground">Resumen Ejecutivo (PDF)</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Documento gerencial con tablas resumen clave, promedios por área y desgloses por categoría de competencia.
          </p>
          <button className="flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
            <Download className="w-4 h-4" />
            Generar Reporte
          </button>
        </div>
      </div>

      {/* Filter and Table Panel */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-lg text-foreground">Filtros de Exportación Personalizada</h3>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <MultiSelectSearch
              options={areas}
              selectedValues={selectedAreas}
              onChange={setSelectedAreas}
              placeholder="Todas las áreas"
              searchPlaceholder="Buscar área..."
              label="Área"
            />
          </div>

          <div className="space-y-1.5">
            <MultiSelectSearch
              options={positions}
              selectedValues={selectedPositions}
              onChange={setSelectedPositions}
              placeholder="Todos los cargos"
              searchPlaceholder="Buscar cargo..."
              label="Cargo"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Resultado</label>
            <select 
              value={selectedResult}
              onChange={(e) => setSelectedResult(e.target.value)}
              className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="">Todos los resultados</option>
              <option value="aprobado">Aprobado</option>
              <option value="plan_mejoramiento">Plan de Mejoramiento</option>
              <option value="no_aprobado">No Aprobado</option>
            </select>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Fecha de Corte (Inicio)</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30" 
            />
          </div>
          
          <div className="space-y-1.5 flex items-end">
            <button 
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full h-10 rounded-lg gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-55 shadow"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Buscar y Filtrar</span>
            </button>
          </div>
        </div>

        {/* Results grid */}
        {filteredEvaluations.length > 0 ? (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-sm text-muted-foreground font-medium">
                Se encontraron <span className="font-bold text-foreground">{filteredEvaluations.length}</span> evaluaciones que coinciden con los filtros.
              </span>
              <button 
                onClick={handleExportFilteredExcel}
                className="flex items-center gap-2 self-start sm:self-center px-4 py-2 rounded-lg border border-success-200 bg-success-50/50 dark:bg-success-950/20 text-success-600 hover:bg-success-50 dark:hover:bg-success-950/40 text-xs font-semibold transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Exportar Filtrados (Excel)</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b text-muted-foreground uppercase font-semibold">
                    <th className="p-3 cursor-pointer select-none" onClick={() => handleSort("collaborator")}>
                      <div className="flex items-center gap-1 hover:text-foreground transition-colors font-semibold">
                        Colaborador
                        {sortField === "collaborator" ? (
                          sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 opacity-55" />
                        )}
                      </div>
                    </th>
                    <th className="p-3 cursor-pointer select-none" onClick={() => handleSort("position")}>
                      <div className="flex items-center gap-1 hover:text-foreground transition-colors font-semibold">
                        Cargo
                        {sortField === "position" ? (
                          sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 opacity-55" />
                        )}
                      </div>
                    </th>
                    <th className="p-3 cursor-pointer select-none" onClick={() => handleSort("area")}>
                      <div className="flex items-center gap-1 hover:text-foreground transition-colors font-semibold">
                        Área
                        {sortField === "area" ? (
                          sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 opacity-55" />
                        )}
                      </div>
                    </th>
                    <th className="p-3 cursor-pointer select-none" onClick={() => handleSort("evaluator")}>
                      <div className="flex items-center gap-1 hover:text-foreground transition-colors font-semibold">
                        Evaluador
                        {sortField === "evaluator" ? (
                          sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 opacity-55" />
                        )}
                      </div>
                    </th>
                    <th className="p-3 text-center cursor-pointer select-none" onClick={() => handleSort("score")}>
                      <div className="flex items-center justify-center gap-1 hover:text-foreground transition-colors font-semibold">
                        Calificación
                        {sortField === "score" ? (
                          sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 opacity-55" />
                        )}
                      </div>
                    </th>
                    <th className="p-3 text-center cursor-pointer select-none" onClick={() => handleSort("result")}>
                      <div className="flex items-center justify-center gap-1 hover:text-foreground transition-colors font-semibold">
                        Resultado
                        {sortField === "result" ? (
                          sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 opacity-55" />
                        )}
                      </div>
                    </th>
                    <th className="p-3 cursor-pointer select-none" onClick={() => handleSort("date")}>
                      <div className="flex items-center gap-1 hover:text-foreground transition-colors font-semibold">
                        Fecha Finalizado
                        {sortField === "date" ? (
                          sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 opacity-55" />
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y text-foreground">
                  {sortedFiltered.map((item) => {
                    const resObj = item.result && !Array.isArray(item.result)
                      ? item.result
                      : item.result?.[0] || null;
                    return (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium">{item.collaborator?.full_name || "Desconocido"}</td>
                        <td className="p-3 text-muted-foreground">{item.collaborator?.position?.name || "—"}</td>
                        <td className="p-3 text-muted-foreground">{item.collaborator?.areas?.name || "—"}</td>
                        <td className="p-3 text-muted-foreground">
                          {item.evaluator ? `${item.evaluator.first_name} ${item.evaluator.last_name}` : "—"}
                        </td>
                        <td className="p-3 text-center font-bold text-sm">
                          {resObj ? formatScore(resObj.overall_average) : "—"}
                        </td>
                        <td className="p-3 text-center">
                          {resObj ? (
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${getResultColor(resObj.result)}`}>
                              {getResultLabel(resObj.result)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border bg-muted text-muted-foreground">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {item.finalized_at ? new Date(item.finalized_at).toLocaleDateString("es-ES") : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="pt-8 text-center text-sm text-muted-foreground border-t border-border">
            No se encontraron evaluaciones registradas con los filtros seleccionados.
          </div>
        )}
      </div>
    </div>
  );
}
