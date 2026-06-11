"use client";

import React, { useEffect, useState } from "react";
import { FileBarChart2, Download, FileSpreadsheet, FileText, Filter, TrendingUp, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getAreas } from "@/app/actions/config";
import { getEvaluations } from "@/app/actions/evaluations";
import { getPMIs } from "@/app/actions/pmi";
import { formatScore, getResultLabel, getResultColor } from "@/lib/utils";
import * as XLSX from "xlsx";

interface AreaData {
  id: string;
  name: string;
}

interface EvaluationItem {
  id: string;
  collaborator: {
    full_name: string;
    document_number: string;
    position?: { name: string };
    areas?: { name: string };
  };
  evaluator?: {
    first_name: string;
    last_name: string;
  };
  finalized_at?: string;
  created_at: string;
  result?: any;
}

export default function ReportesPage() {
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<EvaluationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Filters
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedResult, setSelectedResult] = useState("");
  const [startDate, setStartDate] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [areasData, evalsRes] = await Promise.all([
          getAreas(),
          getEvaluations()
        ]);
        
        setAreas(areasData || []);
        if (evalsRes.data) {
          setEvaluations(evalsRes.data as any[]);
          setFilteredEvaluations(evalsRes.data as any[]);
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

    // Filter by Area Name
    if (selectedArea) {
      results = results.filter(
        (item) => item.collaborator?.areas?.name === selectedArea
      );
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
      const excelRows = evaluations.map((item) => {
        const resObj = item.result && !Array.isArray(item.result)
          ? item.result
          : item.result?.[0] || null;
        return {
          "ID Evaluación": item.id,
          "Colaborador": item.collaborator?.full_name || "N/A",
          "Documento": item.collaborator?.document_number || "N/A",
          "Área": item.collaborator?.areas?.name || "N/A",
          "Cargo": item.collaborator?.position?.name || "N/A",
          "Evaluador": item.evaluator ? `${item.evaluator.first_name} ${item.evaluator.last_name}` : "N/A",
          "Fecha de Finalización": item.finalized_at ? new Date(item.finalized_at).toLocaleDateString("es-ES") : "Pendiente",
          "Puntaje (Promedio)": resObj ? Number(formatScore(resObj.overall_average)) : 0,
          "Resultado EVD": resObj ? getResultLabel(resObj.result) : "Pendiente",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Consolidado");
      
      // Auto-fit column widths
      const maxColWidth = excelRows.reduce((acc, row) => {
        Object.keys(row).forEach((key, i) => {
          const val = String((row as any)[key]);
          acc[i] = Math.max(acc[i] || 10, val.length + 2, key.length + 2);
        });
        return acc;
      }, [] as number[]);
      worksheet["!cols"] = maxColWidth.map(w => ({ wch: w }));

      XLSX.writeFile(workbook, `Consolidado_General_EVD_${new Date().getFullYear()}.xlsx`);
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

      const excelRows = res.data.map((pmi: any) => {
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
        logoImg = await new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image();
          img.src = "/logo.png";
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

      const areaStats: Record<string, { sum: number; count: number }> = {};
      const catStats: Record<string, { sum: number; count: number }> = {};

      evaluations.forEach((item) => {
        const resObj = item.result && !Array.isArray(item.result)
          ? item.result
          : item.result?.[0] || null;

        if (resObj) {
          const score = resObj.overall_average || 0;
          scoreSum += score;

          if (resObj.result === "aprobado") approvedCount++;
          else if (resObj.result === "plan_mejoramiento") pmiCount++;
          else noApprovedCount++;

          // Area
          const areaName = item.collaborator?.areas?.name || "Sin Área";
          if (!areaStats[areaName]) areaStats[areaName] = { sum: 0, count: 0 };
          areaStats[areaName].sum += score;
          areaStats[areaName].count++;

          // Categories
          if (resObj.category_scores) {
            Object.entries(resObj.category_scores).forEach(([_, cat]: [string, any]) => {
              if (!catStats[cat.name]) catStats[cat.name] = { sum: 0, count: 0 };
              catStats[cat.name].sum += cat.average || 0;
              catStats[cat.name].count++;
            });
          }
        }
      });

      const averageScore = total > 0 ? (scoreSum / total).toFixed(2) : "0.00";

      // 1. Metrics table
      const metricsRows = [
        ["Total Evaluaciones Registradas", `${total}`],
        ["Calificación Promedio General", `${averageScore} / 5.0`],
        ["Colaboradores Aprobados (Nota >= 4.0)", `${approvedCount} (${total > 0 ? Math.round((approvedCount/total)*100) : 0}%)`],
        ["Colaboradores en Plan de Mejora (Nota 3.1 - 3.9)", `${pmiCount} (${total > 0 ? Math.round((pmiCount/total)*100) : 0}%)`],
        ["Colaboradores No Aprobados (Nota < 3.1)", `${noApprovedCount} (${total > 0 ? Math.round((noApprovedCount/total)*100) : 0}%)`]
      ];

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
      doc.text("1. MÉTRICAS CLAVE", marginX, 48);

      autoTable(doc, {
        startY: 52,
        head: [],
        body: metricsRows,
        theme: "grid",
        styles: { fontSize: 8.5, cellPadding: 2.5, textColor: textColorDark as any },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 100, fillColor: [248, 250, 252] as any },
          1: { cellWidth: 80, halign: "center" }
        },
        margin: { left: marginX, right: marginX }
      });

      let currentY = (doc as any).lastAutoTable.finalY + 8;

      // 2. Area table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
      doc.text("2. PROMEDIOS DE DESEMPEÑO POR ÁREA", marginX, currentY);
      currentY += 4;

      const areaHeaders = [["Área / Departamento", "Calificación Promedio", "Colaboradores Evaluados"]];
      const areaRows = Object.entries(areaStats).map(([name, stat]) => [
        name,
        `${(stat.sum / stat.count).toFixed(2)} / 5.0`,
        `${stat.count} colaboradores`
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

  // Export Excel for Filtered Data
  const handleExportFilteredExcel = () => {
    if (filteredEvaluations.length === 0) {
      toast.error("No hay resultados de búsqueda para exportar");
      return;
    }

    const toastId = toast.loading("Exportando resultados filtrados...");
    try {
      const excelRows = filteredEvaluations.map((item) => {
        const resObj = item.result && !Array.isArray(item.result)
          ? item.result
          : item.result?.[0] || null;
        return {
          "Colaborador": item.collaborator?.full_name || "N/A",
          "Documento": item.collaborator?.document_number || "N/A",
          "Área": item.collaborator?.areas?.name || "N/A",
          "Cargo": item.collaborator?.position?.name || "N/A",
          "Fecha Evaluación": item.finalized_at ? new Date(item.finalized_at).toLocaleDateString("es-ES") : new Date(item.created_at).toLocaleDateString("es-ES"),
          "Puntaje": resObj ? Number(formatScore(resObj.overall_average)) : 0,
          "Resultado": resObj ? getResultLabel(resObj.result) : "Pendiente",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados Filtrados");

      const maxColWidth = excelRows.reduce((acc, row) => {
        Object.keys(row).forEach((key, i) => {
          const val = String((row as any)[key]);
          acc[i] = Math.max(acc[i] || 10, val.length + 2, key.length + 2);
        });
        return acc;
      }, [] as number[]);
      worksheet["!cols"] = maxColWidth.map(w => ({ wch: w }));

      XLSX.writeFile(workbook, `Resultados_Filtrados_EVD_${new Date().toISOString().slice(0,10)}.xlsx`);
      toast.success("Resultados filtrados exportados exitosamente", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Error al exportar resultados filtrados", { id: toastId });
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
            Descarga la matriz completa con todos los colaboradores, calificaciones por pregunta y promedios finales.
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
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Área</label>
            <select 
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="">Todas las áreas</option>
              {areas.map((area) => (
                <option key={area.id} value={area.name}>{area.name}</option>
              ))}
            </select>
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
                    <th className="p-3">Colaborador</th>
                    <th className="p-3">Cargo</th>
                    <th className="p-3">Área</th>
                    <th className="p-3 text-center">Calificación</th>
                    <th className="p-3 text-center">Resultado</th>
                    <th className="p-3">Fecha Finalizado</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-foreground">
                  {filteredEvaluations.map((item) => {
                    const resObj = item.result && !Array.isArray(item.result)
                      ? item.result
                      : item.result?.[0] || null;
                    return (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium">{item.collaborator?.full_name || "Desconocido"}</td>
                        <td className="p-3 text-muted-foreground">{item.collaborator?.position?.name || "—"}</td>
                        <td className="p-3 text-muted-foreground">{item.collaborator?.areas?.name || "—"}</td>
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
