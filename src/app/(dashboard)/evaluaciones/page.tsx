"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList, Plus, Search, Filter, Eye,
  Edit, FileDown, MoreHorizontal, ChevronLeft, ChevronRight, FileText
} from "lucide-react";
import Link from "next/link";
import { cn, getResultLabel, getStatusLabel, formatDate, formatScore, getInitials } from "@/lib/utils";
import { toast } from "sonner";

import { getEvaluations, getEvaluationById } from "@/app/actions/evaluations";
import { PdfPreviewModal } from "@/components/ui/pdf-preview-modal";

const STATUS_STYLE: Record<string, string> = {
  borrador: "text-muted-foreground bg-muted border-border",
  en_proceso: "text-brand-600 bg-brand-50 border-brand-200 dark:bg-brand-950/30",
  finalizada: "text-success-600 bg-success-50 border-success-200 dark:bg-success-950/30",
  reabierta: "text-warning-600 bg-warning-50 border-warning-200 dark:bg-warning-950/30",
  anulada: "text-danger-600 bg-danger-50 border-danger-200 dark:bg-danger-950/30",
};

const RESULT_STYLE: Record<string, string> = {
  aprobado: "text-success-600 bg-success-50 border-success-200 dark:bg-success-950/30",
  plan_mejoramiento: "text-warning-600 bg-warning-50 border-warning-200 dark:bg-warning-950/30",
  no_aprobado: "text-danger-600 bg-danger-50 border-danger-200 dark:bg-danger-950/30",
  pendiente: "text-muted-foreground bg-muted border-border",
};

export default function EvaluacionesPage() {
  const [search, setSearch] = useState("");
  const [filterResult, setFilterResult] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [previewPdfBlob, setPreviewPdfBlob] = useState<Blob | null>(null);
  const [previewPdfFileName, setPreviewPdfFileName] = useState("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handlePreviewClick = async (id: string) => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    const toastId = toast.loading("Obteniendo detalles de la evaluación...");
    
    try {
      const res = await getEvaluationById(id);
      if (res.error || !res.data) {
        toast.error("Error al obtener los detalles de la evaluación: " + (res.error || "No se encontraron datos"), { id: toastId });
        setIsGeneratingPdf(false);
        return;
      }
      
      const evalData = res.data;
      toast.loading("Generando previsualización de PDF...", { id: toastId });
      
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Load logo image first
      let logoImg: HTMLImageElement | null = null;
      try {
        logoImg = await new Promise<HTMLImageElement | null>((resolve, reject) => {
          const img = new Image();
          img.src = "/logo.png";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        });
      } catch (e) {
        console.error("Error loading logo image:", e);
      }
      
      const brandColorBlue = [1, 33, 105]; // #012169
      const brandColorLightBlue = [0, 132, 213]; // #0084D5
      const textColorDark = [30, 41, 59]; // #1e293b
      const textColorMuted = [100, 116, 139]; // #64748b
      
      // Page Margins
      const marginX = 15;
      let posY = 20;
      
      const formatPDFDate = (dateStr: any) => {
        if (!dateStr) return "N/A";
        try {
          const d = new Date(dateStr);
          return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("es-ES");
        } catch {
          return "N/A";
        }
      };

      const drawHeader = () => {
        doc.setFillColor(brandColorBlue[0], brandColorBlue[1], brandColorBlue[2]);
        doc.rect(0, 0, 210, 4, "F");
        
        // Draw Logo if loaded (on the left side)
        let textStartX = marginX;
        if (logoImg) {
          try {
            doc.addImage(logoImg, "PNG", marginX, 6, 13, 13);
            textStartX = marginX + 16;
          } catch (err) {
            console.error("Error drawing logo to PDF:", err);
          }
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
        doc.setLineWidth(0.5);
        doc.line(marginX, 22, 210 - marginX, 22);
      };
      
      const drawFooter = (pageNumber: number, totalPages: number) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
        
        const currentDate = new Date().toLocaleDateString("es-ES");
        doc.text(`Generado el: ${currentDate}`, marginX, 285);
        doc.text(`Página ${pageNumber} de ${totalPages}`, 210 - marginX, 285, { align: "right" });
        
        doc.setDrawColor(226, 232, 240);
        doc.line(marginX, 280, 210 - marginX, 280);
      };
      
      // PAGE 1: COVER
      posY = 32;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(brandColorBlue[0], brandColorBlue[1], brandColorBlue[2]);
      doc.text("REPORTE DE EVALUACIÓN DE DESEMPEÑO", marginX, posY);
      posY += 8;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      const dateText = evalData.finalized_at 
        ? `Fecha de Finalización: ${formatPDFDate(evalData.finalized_at)}`
        : `Fecha de Registro: ${formatPDFDate(evalData.created_at)}`;
      doc.text(dateText, marginX, posY);
      posY += 10;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
      doc.text("1. DATOS DEL COLABORADOR (EVALUADO)", marginX, posY);
      posY += 4;
      
      const collabInfo = [
        ["Nombre Completo:", evalData.collaborator?.full_name || "N/A", "Documento:", `${evalData.collaborator?.document_type || "CC"} ${evalData.collaborator?.document_number || "N/A"}`],
        ["Cargo Actual:", evalData.collaborator?.position?.name || "N/A", "Área / Departamento:", evalData.collaborator?.areas?.name || evalData.collaborator?.area?.name || "N/A"],
        ["Sede / Ciudad:", evalData.collaborator?.workplace_city || evalData.collaborator?.workplace || "N/A", "Tipo de Contrato:", evalData.collaborator?.contract_type || "N/A"],
        ["Fecha de Ingreso:", formatPDFDate(evalData.collaborator?.hire_date), "Estado:", evalData.collaborator?.status || "N/A"]
      ];
      
      autoTable(doc, {
        startY: posY,
        head: [],
        body: collabInfo,
        theme: "plain",
        styles: { fontSize: 9, cellPadding: 2, textColor: textColorDark as any },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 35 },
          1: { cellWidth: 55 },
          2: { fontStyle: "bold", cellWidth: 35 },
          3: { cellWidth: 55 }
        },
        margin: { left: marginX, right: marginX }
      });
      
      posY = (doc as any).lastAutoTable.finalY + 8;
      
      // SECTION: EVALUATOR INFO
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
      doc.text("2. DATOS DEL EVALUADOR", marginX, posY);
      posY += 4;
      
      const evaluatorInfo = [
        ["Nombre del Evaluador:", evalData.evaluator ? `${evalData.evaluator.first_name} ${evalData.evaluator.last_name}` : "N/A", "Cargo/Rol del Evaluador:", evalData.evaluator?.role?.display_name || "N/A"],
        ["Correo Electrónico:", evalData.evaluator?.email || "N/A", "Versión del Proceso EVD:", evalData.version?.name || "N/A"]
      ];
      
      autoTable(doc, {
        startY: posY,
        head: [],
        body: evaluatorInfo,
        theme: "plain",
        styles: { fontSize: 9, cellPadding: 2, textColor: textColorDark as any },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 45 },
          1: { cellWidth: 45 },
          2: { fontStyle: "bold", cellWidth: 45 },
          3: { cellWidth: 45 }
        },
        margin: { left: marginX, right: marginX }
      });
      
      posY = (doc as any).lastAutoTable.finalY + 8;
      
      // SECTION: SUMMARY OF RESULTS
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
      doc.text("3. RESUMEN DE RESULTADOS", marginX, posY);
      posY += 4;
      
      const resultObj = evalData.result && !Array.isArray(evalData.result) ? evalData.result : evalData.result?.[0] || null;
      const overallScore = resultObj ? resultObj.overall_average : 0;
      const statusLabelText = resultObj ? getResultLabel(resultObj.result) : "Pendiente de finalizar";
      const scoreExplanation = overallScore >= 4.5 ? "Desempeño Excelente: Supera las expectativas consistentemente." 
                           : overallScore >= 4.0 ? "Desempeño Sobresaliente: Cumple lo esperado y a veces lo supera."
                           : overallScore >= 3.1 ? "Desempeño Aceptable (Plan de Mejoramiento): Cumple lo esperado, pero requiere plan de mejora."
                           : "Desempeño Insatisfactorio (No Aprobado): No cumple con los estándares mínimos requeridos.";
      
      const summaryInfo = [
        ["PUNTUACIÓN OBTENIDA (PROMEDIO):", `${formatScore(overallScore)} / 5.0`],
        ["RESULTADO GENERAL:", statusLabelText.toUpperCase()],
        ["DESCRIPCIÓN:", scoreExplanation]
      ];
      
      autoTable(doc, {
        startY: posY,
        head: [],
        body: summaryInfo,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 3, textColor: textColorDark as any },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 60, fillColor: [248, 250, 252] as any },
          1: { cellWidth: 120 }
        },
        margin: { left: marginX, right: marginX }
      });
      
      posY = (doc as any).lastAutoTable.finalY + 4;
      if (resultObj?.has_critical_fails && resultObj.critical_fails_detail?.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(239, 68, 68); // Red color
        doc.text("CRITERIOS CRÍTICOS INCUMPLIDOS (Causales de Plan de Mejoramiento):", marginX, posY);
        posY += 4;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
        
        resultObj.critical_fails_detail.forEach((fail: any) => {
          const answerObj = evalData.answers?.find((a: any) => a.question_id === fail.question_id);
          const categoryId = answerObj?.category_id;
          const categoryName = (categoryId && resultObj.category_scores?.[categoryId]?.name) || "Categoría";
          
          const text = `- [${categoryName}] "${fail.question}": Obtuvo ${fail.score} (mínimo requerido: ${fail.min_required})`;
          const lines = doc.splitTextToSize(text, 180);
          lines.forEach((line: string) => {
            doc.text(line, marginX + 4, posY);
            posY += 4.5;
          });
        });
        posY += 2;
      } else {
        posY = (doc as any).lastAutoTable.finalY + 8;
      }

      // SECTION: CATEGORY SCORES
      const categoryScores = resultObj?.category_scores || {};
      if (categoryScores && Object.keys(categoryScores).length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
        doc.text("4. CALIFICACIÓN POR CATEGORÍA", marginX, posY);
        posY += 6;
        
        const catHeaders = [["Categoría (Preguntas)", "Promedio"]];
        const catRows = Object.entries(categoryScores).map(([_, cat]: [string, any]) => [
          `${cat.name || "Categoría"} (${cat.count || 0} preguntas)`,
          `${formatScore(cat.average || 0)} / 5.0`
        ]);
        
        autoTable(doc, {
          startY: posY,
          head: catHeaders,
          body: catRows,
          theme: "striped",
          headStyles: { fillColor: brandColorBlue as any, textColor: [255, 255, 255] as any, fontStyle: "bold" },
          styles: { fontSize: 8, cellPadding: 2, textColor: textColorDark as any },
          columnStyles: {
            0: { fontStyle: "bold", cellWidth: 155 },
            1: { cellWidth: 25, halign: "center" }
          },
          margin: { left: marginX, right: marginX, top: 26, bottom: 24 }
        });
        
        posY = (doc as any).lastAutoTable.finalY + 8;
      }
      
      // Check space for Escala and Rangos section
      if (posY > 230) {
        doc.addPage();
        posY = 28;
      }

      // SECTION: ESCALA DE CALIFICACIÓN & RANGOS DE RESULTADOS
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
      doc.text("5. ESCALA DE CALIFICACIÓN", marginX, posY);
      doc.text("6. RANGOS DE RESULTADOS", marginX + 95, posY);
      posY += 6;

      autoTable(doc, {
        startY: posY,
        margin: { left: marginX },
        tableWidth: 85,
        head: [["Calificación", "Descripción"]],
        body: [
          ["5", "Excelente"],
          ["4", "Sobresaliente"],
          ["3", "Cumple lo esperado"],
          ["2", "Requiere mejora"],
          ["1", "No cumple"]
        ],
        theme: "grid",
        headStyles: { fillColor: brandColorBlue as any, textColor: [255, 255, 255] as any, fontStyle: "bold", halign: "center" },
        styles: { fontSize: 8, cellPadding: 2, textColor: textColorDark as any },
        columnStyles: {
          0: { halign: "center", fontStyle: "bold", cellWidth: 25 },
          1: { cellWidth: 60 }
        }
      });
      const finalY1 = (doc as any).lastAutoTable.finalY;

      autoTable(doc, {
        startY: posY,
        margin: { left: marginX + 95 },
        tableWidth: 85,
        head: [["Porcentaje", "Resultado"]],
        body: [
          ["4.0 – 5.0", "Aprobado"],
          ["3.1 – 3.9", "Plan de Mejoramiento"],
          ["1.0 - 3.0", "No Aprobado"]
        ],
        theme: "grid",
        headStyles: { fillColor: brandColorBlue as any, textColor: [255, 255, 255] as any, fontStyle: "bold", halign: "center" },
        styles: { fontSize: 8, cellPadding: 2, textColor: textColorDark as any },
        columnStyles: {
          0: { halign: "center", fontStyle: "bold", cellWidth: 35 },
          1: { cellWidth: 50, halign: "center" }
        }
      });
      const finalY2 = (doc as any).lastAutoTable.finalY;

      posY = Math.max(finalY1, finalY2) + 8;

      // PAGE 1 (continued): DETAILED ANSWERS TABLE
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
      doc.text("7. DESGLOSE DETALLADO DE COMPETENCIAS Y PREGUNTAS", marginX, posY);
      posY += 6;
      
      const answersHeaders = [["Código / Competencia", "Pregunta", "Calificación"]];
      const answersRows = (evalData.answers || []).map((ans: any, idx: number) => [
        ans.question?.code || `PREG-${idx + 1}`,
        ans.question?.question || "Pregunta sin descripción",
        `${ans.score} / 5.0`
      ]);
      
      autoTable(doc, {
        startY: posY,
        head: answersHeaders,
        body: answersRows,
        theme: "striped",
        headStyles: { fillColor: brandColorBlue as any, textColor: [255, 255, 255] as any, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2, textColor: textColorDark as any },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 35 },
          1: { cellWidth: 120 },
          2: { cellWidth: 25, halign: "center" }
        },
        margin: { left: marginX, right: marginX, top: 26, bottom: 24 }
      });
      
      posY = (doc as any).lastAutoTable.finalY + 8;
      
      if (posY > 200) {
        doc.addPage();
        posY = 28;
      }
      
      // SECTION: NARRATIVE
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
      doc.text("8. COMENTARIOS Y NARRATIVA DE DESEMPEÑO", marginX, posY);
      posY += 6;
      
      const narratives = [
        ["Observaciones Generales del Evaluador:", evalData.observations || "Sin observaciones registradas."],
        ["Fortalezas Clave Demostradas:", evalData.strengths || "Sin fortalezas registradas."],
        ["Oportunidades de Mejora Identificadas:", evalData.improvement_opportunities || "Sin oportunidades registradas."],
        ["Necesidades de Formación / Capacitación:", evalData.training_needs || "Sin necesidades registradas."]
      ];
      
      autoTable(doc, {
        startY: posY,
        head: [],
        body: narratives,
        theme: "grid",
        styles: { fontSize: 8.5, cellPadding: 3, textColor: textColorDark as any },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 60, fillColor: [248, 250, 252] as any },
          1: { cellWidth: 120 }
        },
        margin: { left: marginX, right: marginX }
      });
      
      posY = (doc as any).lastAutoTable.finalY + 12;
      
      if (posY > 230) {
        doc.addPage();
        posY = 28;
      }
      
      // SECTION: SIGNATURES
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
      doc.text("9. CONFORMIDAD Y FIRMAS", marginX, posY);
      
      const evaluatorSig = evalData.evaluator?.avatar_url;
      const collaboratorSig = (evalData.draft_data as any)?.collaborator_signature;
      
      let sigHeight = 14;
      let sigWidth = 38;
      
      if (evaluatorSig) {
        try {
          doc.addImage(evaluatorSig, "PNG", marginX + 16, posY + 4, sigWidth, sigHeight);
        } catch (err) {
          console.error("Error adding evaluator signature to PDF:", err);
        }
      }
      
      if (collaboratorSig) {
        try {
          doc.addImage(collaboratorSig, "PNG", 210 - marginX - 54, posY + 4, sigWidth, sigHeight);
        } catch (err) {
          console.error("Error adding collaborator signature to PDF:", err);
        }
      }

      posY += 20;
      
      doc.setDrawColor(100, 116, 139);
      doc.setLineWidth(0.5);
      
      doc.line(marginX, posY, marginX + 70, posY);
      doc.line(210 - marginX - 70, posY, 210 - marginX, posY);
      
      posY += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text("Firma del Evaluador", marginX, posY);
      doc.text("Firma del Colaborador Evaluado", 210 - marginX, posY, { align: "right" });
      
      posY += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
      doc.text(evalData.evaluator ? `${evalData.evaluator.first_name} ${evalData.evaluator.last_name}` : "Nombre del Evaluador", marginX, posY);
      doc.text(evalData.collaborator?.full_name || "Nombre del Colaborador", 210 - marginX, posY, { align: "right" });
      
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawHeader();
        drawFooter(i, totalPages);
      }
      
      const blob = doc.output("blob");
      setPreviewPdfBlob(blob);
      const fileName = `EVD_${evalData.collaborator?.full_name?.replace(/\s+/g, "_") || "Colaborador"}_${evalData.evaluation_year || new Date().getFullYear()}.pdf`;
      setPreviewPdfFileName(fileName);
      
      toast.success("PDF generado con éxito", { id: toastId });
      setShowPdfPreview(true);
    } catch (err: any) {
      console.error(err);
      toast.error("Error al generar el PDF: " + (err?.message || err), { id: toastId });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  React.useEffect(() => {
    async function loadEvaluations() {
      const res = await getEvaluations();
      if (!res.error && res.data) {
        const mapped = res.data.map((e: any) => {
          const resObj = e.result && !Array.isArray(e.result) ? e.result : e.result?.[0] || null;
          return {
            id: e.id,
            collaborator: e.collaborator?.full_name || "Desconocido",
            area: e.collaborator?.areas?.name || "—",
            position: e.collaborator?.position?.name || "—",
            evaluator: e.evaluator ? `${e.evaluator.first_name} ${e.evaluator.last_name}` : "—",
            date: e.created_at,
            year: e.evaluation_year,
            status: e.status,
            result: resObj ? resObj.result : "pendiente",
            score: resObj ? resObj.overall_average : 0,
            has_pmi: resObj ? resObj.pmi_required : false,
          };
        });
        setEvaluations(mapped);
      }
      setIsLoading(false);
    }
    loadEvaluations();
  }, []);

  const filtered = evaluations.filter((e) => {
    const matchSearch = !search || e.collaborator.toLowerCase().includes(search.toLowerCase());
    const matchResult = !filterResult || e.result === filterResult;
    const matchStatus = !filterStatus || e.status === filterStatus;
    return matchSearch && matchResult && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  // Summary stats
  const total = evaluations.length;
  const aprobados = evaluations.filter(e => e.result === "aprobado").length;
  const conPMI = evaluations.filter(e => e.has_pmi).length;
  const pendientes = evaluations.filter(e => e.status === "borrador" || e.status === "en_proceso").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Evaluaciones de Desempeño</h1>
          <p className="text-muted-foreground text-sm mt-1">Año 2026 · Flota Sugamuxi S.A.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-foreground text-sm hover:bg-accent transition-colors">
            <FileDown className="w-4 h-4" />
            Exportar
          </button>
          <Link href="/evaluaciones/nueva">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md">
              <Plus className="w-4 h-4" />
              Nueva Evaluación
            </button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: total, color: "brand" },
          { label: "Aprobados", value: aprobados, color: "success" },
          { label: "Con PMI", value: conPMI, color: "warning" },
          { label: "Pendientes", value: pendientes, color: "violet" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="p-4 rounded-xl border bg-card text-center"
          >
            <p className={cn(
              "text-3xl font-bold",
              s.color === "success" ? "text-success-600" :
              s.color === "warning" ? "text-warning-600" :
              s.color === "violet" ? "text-violet-500" : "text-brand-500"
            )}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por colaborador..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 px-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="en_proceso">En proceso</option>
          <option value="finalizada">Finalizada</option>
          <option value="reabierta">Reabierta</option>
        </select>
        <select
          value={filterResult}
          onChange={(e) => setFilterResult(e.target.value)}
          className="h-10 px-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Todos los resultados</option>
          <option value="aprobado">Aprobado</option>
          <option value="plan_mejoramiento">Plan de Mejoramiento</option>
          <option value="no_aprobado">No Aprobado</option>
        </select>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border bg-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm data-table">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Colaborador</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Área / Cargo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Resultado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Promedio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Fecha</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex justify-center items-center gap-3">
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <p className="font-medium text-muted-foreground">Cargando evaluaciones...</p>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No se encontraron evaluaciones.
                  </td>
                </tr>
              ) : (
              paginated.map((ev, i) => (
                <motion.tr
                  key={ev.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {getInitials(ev.collaborator)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{ev.collaborator}</p>
                        <p className="text-xs text-muted-foreground">Año {ev.year}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-sm font-medium">{ev.position}</p>
                    <p className="text-xs text-muted-foreground">{ev.area}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border", STATUS_STYLE[ev.status])}>
                      {getStatusLabel(ev.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {ev.result !== "pendiente" && (
                      <div className="space-y-1">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border", RESULT_STYLE[ev.result])}>
                          {getResultLabel(ev.result)}
                        </span>
                        {ev.has_pmi && (
                          <div className="text-[10px] text-warning-600 font-semibold">PMI generado</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {ev.score > 0 ? (
                      <span className={cn(
                        "font-bold text-lg",
                        ev.score >= 4.0 ? "text-success-600" :
                        ev.score >= 3.1 ? "text-warning-600" : "text-danger-600"
                      )}>
                        {formatScore(ev.score)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                    {formatDate(ev.date)}
                  </td>
                  <td className="px-4 py-3 relative">
                    <div className="flex items-center justify-center gap-1">
                      <Link href={`/evaluaciones/${ev.id}`}>
                        <button className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Ver detalle">
                          <Eye className="w-4 h-4" />
                        </button>
                      </Link>
                      {ev.status === "finalizada" && (
                        <button
                          onClick={() => handlePreviewClick(ev.id)}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                          title="Ver PDF Corporativo"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      {(ev.status === "borrador" || ev.status === "en_proceso") && (
                        <Link href={`/evaluaciones/${ev.id}/editar`}>
                          <button className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Editar">
                            <Edit className="w-4 h-4" />
                          </button>
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(openMenuId === ev.id ? null : ev.id)}
                        className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                    {openMenuId === ev.id && (
                      <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border bg-card shadow-lg z-10">
                        <Link
                          href={`/evaluaciones/${ev.id}`}
                          className="block px-3 py-2 text-sm text-left text-foreground hover:bg-muted"
                        >
                          Ver detalle
                        </Link>
                        {ev.status === "finalizada" && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              handlePreviewClick(ev.id);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted"
                          >
                            Ver PDF
                          </button>
                        )}
                        {(ev.status === "borrador" || ev.status === "en_proceso") && (
                          <Link
                            href={`/evaluaciones/${ev.id}/editar`}
                            className="block px-3 py-2 text-sm text-left text-foreground hover:bg-muted"
                          >
                            Editar
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(ev.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted"
                        >
                          Copiar ID
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
          <p className="text-sm text-muted-foreground">
            {filtered.length} evaluaciones · Página {page} de {totalPages || 1}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-accent disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded-lg hover:bg-accent disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      <PdfPreviewModal
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        pdfBlob={previewPdfBlob}
        fileName={previewPdfFileName}
      />
    </div>
  );
}
