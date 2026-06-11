"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Edit, CalendarCheck, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";
import { getEvaluationById } from "@/app/actions/evaluations";
import { formatDate, formatScore, getResultLabel, getStatusLabel, getInitials } from "@/lib/utils";
import { PdfPreviewModal } from "@/components/ui/pdf-preview-modal";

export default function EvaluationDetailPage() {
  const params = useParams();
  const evaluationId = params?.id as string;
  const [evaluation, setEvaluation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<string | null>(null);
  
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [previewPdfBlob, setPreviewPdfBlob] = useState<Blob | null>(null);
  const [previewPdfFileName, setPreviewPdfFileName] = useState("");

  useEffect(() => {
    if (!evaluationId) return;

    async function loadEvaluation() {
      setIsLoading(true);
      const res = await getEvaluationById(evaluationId);
      if (res.error) {
        setIsError(res.error);
        toast.error("Error cargando la evaluación: " + res.error);
      } else {
        setEvaluation(res.data);
      }
      setIsLoading(false);
    }

    loadEvaluation();
  }, [evaluationId]);

  const result = evaluation?.result && !Array.isArray(evaluation.result) ? evaluation.result : evaluation?.result?.[0] || null;

  const generatePDF = async (download: boolean = true) => {
    if (!evaluation) return null;
    
    const toastId = download ? toast.loading("Generando PDF corporativo...") : undefined;
    
    try {
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
      
      // Helper: Draw header on each page
      const drawHeader = () => {
        // Decorative top bar
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
        
        // Brand Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(brandColorBlue[0], brandColorBlue[1], brandColorBlue[2]);
        doc.text("FLOTA SUGAMUXI S.A.", textStartX, 14);
        
        // Document Subtitle
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
        doc.text("Sistema de Evaluación de Desempeño (EVD)", textStartX, 19);
        
        // Horizontal separator line
        doc.setDrawColor(226, 232, 240); // border color
        doc.setLineWidth(0.5);
        doc.line(marginX, 22, 210 - marginX, 22);
      };
      
      // Helper: Draw footer on each page
      const drawFooter = (pageNumber: number, totalPages: number) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
        
        // Date and Page count
        const currentDate = new Date().toLocaleDateString("es-ES");
        doc.text(`Generado el: ${currentDate}`, marginX, 285);
        doc.text(`Página ${pageNumber} de ${totalPages}`, 210 - marginX, 285, { align: "right" });
        
        // Bottom border
        doc.setDrawColor(226, 232, 240);
        doc.line(marginX, 280, 210 - marginX, 280);
      };

      // PAGE 1: COVER / INFO BLOCK
      posY = 32;
      
      // Document Main Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(brandColorBlue[0], brandColorBlue[1], brandColorBlue[2]);
      doc.text("REPORTE DE EVALUACIÓN DE DESEMPEÑO", marginX, posY);
      posY += 8;
      
      // Date and metadata
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      const dateText = evaluation.finalized_at 
        ? `Fecha de Finalización: ${new Date(evaluation.finalized_at).toLocaleDateString("es-ES")}`
        : `Fecha de Registro: ${new Date(evaluation.created_at).toLocaleDateString("es-ES")}`;
      doc.text(dateText, marginX, posY);
      posY += 10;
      
      // SECTION: COLLABORATOR INFO (EVALUATED)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
      doc.text("1. DATOS DEL COLABORADOR (EVALUADO)", marginX, posY);
      posY += 4;
      
      // Draw Collaborator Table / Grid
      const collabInfo = [
        ["Nombre Completo:", evaluation.collaborator?.full_name || "N/A", "Documento:", `${evaluation.collaborator?.document_type || "CC"} ${evaluation.collaborator?.document_number || "N/A"}`],
        ["Cargo Actual:", evaluation.collaborator?.position?.name || "N/A", "Área / Departamento:", evaluation.collaborator?.areas?.name || evaluation.collaborator?.area?.name || "N/A"],
        ["Sede / Ciudad:", evaluation.collaborator?.workplace_city || evaluation.collaborator?.workplace || "N/A", "Tipo de Contrato:", evaluation.collaborator?.contract_type || "N/A"],
        ["Fecha de Ingreso:", evaluation.collaborator?.hire_date ? new Date(evaluation.collaborator.hire_date).toLocaleDateString("es-ES") : "N/A", "Estado:", evaluation.collaborator?.status || "N/A"]
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
        ["Nombre del Evaluador:", evaluation.evaluator ? `${evaluation.evaluator.first_name} ${evaluation.evaluator.last_name}` : "N/A", "Cargo/Rol del Evaluador:", evaluation.evaluator?.role?.display_name || "N/A"],
        ["Correo Electrónico:", evaluation.evaluator?.email || "N/A", "Versión del Proceso EVD:", evaluation.version?.name || "N/A"]
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
      
      const overallScore = result ? result.overall_average : 0;
      const statusLabel = result ? getResultLabel(result.result) : "Pendiente de finalizar";
      const scoreExplanation = overallScore >= 4.5 ? "Desempeño Excelente: Supera las expectativas consistentemente." 
                           : overallScore >= 4.0 ? "Desempeño Sobresaliente: Cumple y a veces supera las expectativas."
                           : overallScore >= 3.0 ? "Desempeño Competente: Cumple satisfactoriamente con los estándares."
                           : overallScore >= 2.0 ? "Desempeño en Desarrollo: Requiere plan de mejora y formación."
                           : "Desempeño No Aceptable.";
      
      const summaryInfo = [
        ["PUNTUACIÓN OBTENIDA (PROMEDIO):", `${formatScore(overallScore)} / 5.0`],
        ["RESULTADO GENERAL:", statusLabel.toUpperCase()],
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
      
      posY = (doc as any).lastAutoTable.finalY + 8;

      // SECTION: CATEGORY SCORES
      const categoryScores = result?.category_scores || {};
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
      
      // PAGE 1 (continued): DETAILED ANSWERS TABLE
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
      doc.text("5. DESGLOSE DETALLADO DE COMPETENCIAS Y PREGUNTAS", marginX, posY);
      posY += 6;
      
      const answersHeaders = [["Código / Competencia", "Pregunta", "Calificación"]];
      const answersRows = (evaluation.answers || []).map((ans: any, idx: number) => [
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
      
      // Check if we need to add a page for Narratives or if it fits
      if (posY > 200) {
        doc.addPage();
        posY = 28;
      }
      
      // SECTION: NARRATIVE
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
      doc.text("6. COMENTARIOS Y NARRATIVA DE DESEMPEÑO", marginX, posY);
      posY += 6;
      
      const narratives = [
        ["Observaciones Generales del Evaluador:", evaluation.observations || "Sin observaciones registradas."],
        ["Fortalezas Clave Demostradas:", evaluation.strengths || "Sin fortalezas registradas."],
        ["Oportunidades de Mejora Identificadas:", evaluation.improvement_opportunities || "Sin oportunidades registradas."],
        ["Necesidades de Formación / Capacitación:", evaluation.training_needs || "Sin necesidades registradas."]
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
      
      // Check if signature section fits, if not, add a page
      if (posY > 230) {
        doc.addPage();
        posY = 28;
      }
      
      // SECTION: SIGNATURES
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
      doc.text("7. CONFORMIDAD Y FIRMAS", marginX, posY);
      posY += 20;
      
      // Signature lines
      doc.setDrawColor(100, 116, 139);
      doc.setLineWidth(0.5);
      
      // Line for Evaluator
      doc.line(marginX, posY, marginX + 70, posY);
      // Line for Evaluated
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
      doc.text(evaluation.evaluator ? `${evaluation.evaluator.first_name} ${evaluation.evaluator.last_name}` : "Nombre del Evaluador", marginX, posY);
      doc.text(evaluation.collaborator?.full_name || "Nombre del Colaborador", 210 - marginX, posY, { align: "right" });
      
      // Draw Page numbers
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawHeader();
        drawFooter(i, totalPages);
      }
      
      // Save PDF
      if (download) {
        const fileName = `EVD_${evaluation.collaborator?.full_name?.replace(/\s+/g, "_") || "Colaborador"}_${evaluation.evaluation_year || new Date().getFullYear()}.pdf`;
        doc.save(fileName);
        if (toastId) toast.success("PDF generado exitosamente", { id: toastId });
      }
      
      return doc;
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      if (toastId) toast.error("Error al generar el PDF corporativo", { id: toastId });
      return null;
    }
  };

  const handlePreviewPDF = async () => {
    const docObj = await generatePDF(false);
    if (docObj) {
      const blob = docObj.output("blob");
      setPreviewPdfBlob(blob);
      const fileName = `EVD_${evaluation?.collaborator?.full_name?.replace(/\s+/g, "_") || "Colaborador"}_${evaluation?.evaluation_year || new Date().getFullYear()}.pdf`;
      setPreviewPdfFileName(fileName);
      setShowPdfPreview(true);
    }
  };

  return (
    <div className="w-full min-h-screen px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <Link href="/evaluaciones" className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
            <span className="hidden sm:inline">Volver a Evaluaciones</span>
            <span className="sm:hidden">Atrás</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold mt-2 sm:mt-4">Detalle de Evaluación</h1>
        </div>
        <div className="flex items-center gap-2">
          {evaluation && (
            <button
              onClick={handlePreviewPDF}
              className="inline-flex items-center justify-center gap-2 rounded-lg sm:rounded-xl bg-brand-500 hover:bg-brand-600 text-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-colors flex-shrink-0 shadow-md"
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
              <span>Ver PDF Corporativo</span>
            </button>
          )}
          {evaluation && (evaluation.status === "borrador" || evaluation.status === "en_proceso") && (
            <Link href={`/evaluaciones/${evaluation.id}/editar`} className="inline-flex items-center justify-center gap-2 rounded-lg sm:rounded-xl border border-border text-foreground px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold hover:bg-accent transition-colors flex-shrink-0">
              <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
              <span className="hidden sm:inline">Editar</span>
              <span className="sm:hidden">Editar</span>
            </Link>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-lg sm:rounded-xl border bg-card p-6 sm:p-8 text-center text-xs sm:text-sm text-muted-foreground">Cargando evaluación...</div>
      ) : isError ? (
        <div className="rounded-lg sm:rounded-xl border bg-card p-6 sm:p-8 text-center text-xs sm:text-sm text-danger-600">{isError}</div>
      ) : !evaluation ? (
        <div className="rounded-lg sm:rounded-xl border bg-card p-6 sm:p-8 text-center text-xs sm:text-sm text-muted-foreground">Evaluación no encontrada.</div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="rounded-lg sm:rounded-xl border bg-card p-4 sm:p-6 space-y-2 sm:space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Colaborador</p>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full gradient-brand flex items-center justify-center text-white text-sm sm:text-lg font-bold flex-shrink-0">
                  {getInitials(evaluation.collaborator?.full_name || "--")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{evaluation.collaborator?.full_name || "Desconocido"}</p>
                  <p className="text-xs text-muted-foreground truncate">Cargo: {evaluation.collaborator?.position?.name || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">Documento: {evaluation.collaborator?.document_number || "—"}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg sm:rounded-xl border bg-card p-4 sm:p-6 space-y-2 sm:space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Evaluador</p>
              <p className="font-semibold text-sm">{evaluation.evaluator ? `${evaluation.evaluator.first_name} ${evaluation.evaluator.last_name}` : "—"}</p>
              <p className="text-xs text-muted-foreground">Cargo/Rol: {evaluation.evaluator?.role?.display_name || "—"}</p>
              <p className="text-xs text-muted-foreground">Versión: {evaluation.version?.name || "—"}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="rounded-lg sm:rounded-xl border bg-card p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Estado</p>
              <span className="mt-2 inline-flex items-center rounded-full border px-2 sm:px-3 py-1 text-xs font-semibold">{getStatusLabel(evaluation.status)}</span>
            </div>
            <div className="rounded-lg sm:rounded-xl border bg-card p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Resultado</p>
              <span className="mt-2 inline-flex items-center rounded-full border px-2 sm:px-3 py-1 text-xs font-semibold">{result ? getResultLabel(result.result) : "Pendiente"}</span>
            </div>
            <div className="rounded-lg sm:rounded-xl border bg-card p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Promedio</p>
              <p className={`mt-2 text-xl sm:text-2xl font-bold ${result ? "text-foreground" : "text-muted-foreground"}`}>
                {result ? formatScore(result.overall_average) : "—"}
              </p>
            </div>
          </div>

          {/* Category Scores */}
          {result?.category_scores && Object.keys(result.category_scores).length > 0 && (
            <div className="rounded-lg sm:rounded-xl border bg-card p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold mb-4">Calificación por Categoría</h2>
              <div className="space-y-3">
                {Object.entries(result.category_scores).map(([catId, cat]: [string, any]) => {
                  const avg = typeof cat.average === "number" ? cat.average : 0;
                  const pct = Math.round((avg / 5) * 100);
                  const color = avg >= 4.0 ? "bg-success-500" : avg >= 3.1 ? "bg-warning-500" : "bg-danger-500";
                  const textColor = avg >= 4.0 ? "text-success-600" : avg >= 3.1 ? "text-warning-600" : "text-danger-600";
                  return (
                    <div key={catId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-medium text-foreground truncate pr-3">{cat.name}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`font-bold ${textColor}`}>{formatScore(avg)}</span>
                          <span className="text-muted-foreground text-xs">/ 5.0</span>
                          <span className="text-muted-foreground text-xs">({cat.count} preg.)</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
            <div className="rounded-lg sm:rounded-xl border bg-card p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <FileText className="w-4 sm:w-5 h-4 sm:h-5 text-primary flex-shrink-0" />
                <h2 className="text-base sm:text-lg font-semibold">Narrativa</h2>
              </div>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground mb-0.5">Observaciones</p>
                  <p className="line-clamp-3">{evaluation.observations || "—"}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-0.5">Fortalezas</p>
                  <p className="line-clamp-3">{evaluation.strengths || "—"}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-0.5">Oportunidades de mejora</p>
                  <p className="line-clamp-3">{evaluation.improvement_opportunities || "—"}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-0.5">Necesidades de formación</p>
                  <p className="line-clamp-3">{evaluation.training_needs || "—"}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg sm:rounded-xl border bg-card p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <CalendarCheck className="w-4 sm:w-5 h-4 sm:h-5 text-primary flex-shrink-0" />
                <h2 className="text-base sm:text-lg font-semibold">Fechas</h2>
              </div>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground mb-0.5">Creado</p>
                  <p>{formatDate(evaluation.created_at)}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-0.5">Finalizado</p>
                  <p>{evaluation.finalized_at ? formatDate(evaluation.finalized_at) : "—"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg sm:rounded-xl border bg-card p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Respuestas</h2>
            {evaluation.answers?.length ? (
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                {evaluation.answers.map((answer: any) => (
                  <div key={answer.question_id} className="rounded-lg border border-muted/30 p-3 sm:p-4 bg-muted/10">
                    <p className="font-semibold text-sm">{answer.question?.question || answer.question_id}</p>
                    <p className="text-xs text-muted-foreground mt-1">Puntaje: {answer.score}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground">No se encontraron respuestas asociadas.</p>
            )}
          </div>
        </div>
      )}
      </div>
      
      <PdfPreviewModal
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        pdfBlob={previewPdfBlob}
        fileName={previewPdfFileName}
      />
    </div>
  );
}
