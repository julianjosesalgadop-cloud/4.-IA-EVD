"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Edit, CalendarCheck, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";
import { getEvaluationById } from "@/app/actions/evaluations";
import { formatDate, formatScore, getResultLabel, getStatusLabel, getInitials } from "@/lib/utils";

export default function EvaluationDetailPage() {
  const params = useParams();
  const evaluationId = params?.id as string;
  const [evaluation, setEvaluation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<string | null>(null);

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

  const generatePDF = async () => {
    if (!evaluation) return;
    
    const toastId = toast.loading("Generando PDF corporativo...");
    
    try {
      const { jsPDF } = await import("jspdf");
      await import("jspdf-autotable");
      
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
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
        
        // Brand Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(brandColorBlue[0], brandColorBlue[1], brandColorBlue[2]);
        doc.text("FLOTA SUGAMUXI S.A.", marginX, 15);
        
        // Document Subtitle
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
        doc.text("Sistema de Evaluación de Desempeño (EVD)", marginX, 19);
        
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
      drawHeader();
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
      
      (doc as any).autoTable({
        startY: posY,
        head: [],
        body: collabInfo,
        theme: "plain",
        styles: { fontSize: 9, cellPadding: 2, textColor: textColorDark },
        columnStyles: {
          0: { fontStyle: "bold", width: 35 },
          1: { width: 55 },
          2: { fontStyle: "bold", width: 35 },
          3: { width: 55 }
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
      
      (doc as any).autoTable({
        startY: posY,
        head: [],
        body: evaluatorInfo,
        theme: "plain",
        styles: { fontSize: 9, cellPadding: 2, textColor: textColorDark },
        columnStyles: {
          0: { fontStyle: "bold", width: 45 },
          1: { width: 45 },
          2: { fontStyle: "bold", width: 45 },
          3: { width: 45 }
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
      
      (doc as any).autoTable({
        startY: posY,
        head: [],
        body: summaryInfo,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 3, textColor: textColorDark },
        columnStyles: {
          0: { fontStyle: "bold", width: 60, fillColor: [248, 250, 252] },
          1: { width: 120 }
        },
        margin: { left: marginX, right: marginX }
      });
      
      posY = (doc as any).lastAutoTable.finalY + 8;
      
      // PAGE 2: DETAILED ANSWERS TABLE
      doc.addPage();
      drawHeader();
      posY = 32;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
      doc.text("4. DESGLOSE DETALLADO DE COMPETENCIAS Y PREGUNTAS", marginX, posY);
      posY += 6;
      
      const answersHeaders = [["Código / Competencia", "Pregunta", "Calificación", "Comentario"]];
      const answersRows = (evaluation.answers || []).map((ans: any, idx: number) => [
        ans.question?.code || `PREG-${idx + 1}`,
        ans.question?.question || "Pregunta sin descripción",
        `${ans.score} / 5.0`,
        ans.comment || "Sin comentario"
      ]);
      
      (doc as any).autoTable({
        startY: posY,
        head: answersHeaders,
        body: answersRows,
        theme: "striped",
        headStyles: { fillColor: brandColorBlue, textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2, textColor: textColorDark },
        columnStyles: {
          0: { fontStyle: "bold", width: 35 },
          1: { width: 85 },
          2: { width: 25, halign: "center" },
          3: { width: 35 }
        },
        margin: { left: marginX, right: marginX }
      });
      
      posY = (doc as any).lastAutoTable.finalY + 8;
      
      // Check if we need to add a page for Narratives or if it fits
      if (posY > 200) {
        doc.addPage();
        drawHeader();
        posY = 32;
      }
      
      // SECTION: NARRATIVE
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
      doc.text("5. COMENTARIOS Y NARRATIVA DE DESEMPEÑO", marginX, posY);
      posY += 6;
      
      const narratives = [
        ["Observaciones Generales del Evaluador:", evaluation.observations || "Sin observaciones registradas."],
        ["Fortalezas Clave Demostradas:", evaluation.strengths || "Sin fortalezas registradas."],
        ["Oportunidades de Mejora Identificadas:", evaluation.improvement_opportunities || "Sin oportunidades registradas."],
        ["Necesidades de Formación / Capacitación:", evaluation.training_needs || "Sin necesidades registradas."]
      ];
      
      (doc as any).autoTable({
        startY: posY,
        head: [],
        body: narratives,
        theme: "grid",
        styles: { fontSize: 8.5, cellPadding: 3, textColor: textColorDark },
        columnStyles: {
          0: { fontStyle: "bold", width: 60, fillColor: [248, 250, 252] },
          1: { width: 120 }
        },
        margin: { left: marginX, right: marginX }
      });
      
      posY = (doc as any).lastAutoTable.finalY + 12;
      
      // Check if signature section fits, if not, add a page
      if (posY > 230) {
        doc.addPage();
        drawHeader();
        posY = 32;
      }
      
      // SECTION: SIGNATURES
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
      doc.text("6. CONFORMIDAD Y FIRMAS", marginX, posY);
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
        drawFooter(i, totalPages);
      }
      
      // Save PDF
      const fileName = `EVD_${evaluation.collaborator?.full_name?.replace(/\s+/g, "_") || "Colaborador"}_${evaluation.evaluation_year || new Date().getFullYear()}.pdf`;
      doc.save(fileName);
      
      toast.success("PDF generado exitosamente", { id: toastId });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error al generar el PDF corporativo", { id: toastId });
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
              onClick={generatePDF}
              className="inline-flex items-center justify-center gap-2 rounded-lg sm:rounded-xl bg-brand-500 hover:bg-brand-600 text-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-colors flex-shrink-0 shadow-md"
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
              <span>Descargar PDF</span>
            </button>
          )}
          {evaluation && (evaluation.status === "borrador" || evaluation.status === "en_proceso") && (
            <Link href={`/evaluaciones/${evaluation.id}/editar`} className="inline-flex items-center justify-center gap-2 rounded-lg sm:rounded-xl border px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold hover:bg-accent transition-colors flex-shrink-0">
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
                  <p className="text-xs text-muted-foreground truncate">Documento: {evaluation.collaborator?.document_number || "—"}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg sm:rounded-xl border bg-card p-4 sm:p-6 space-y-2 sm:space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Evaluador</p>
              <p className="font-semibold text-sm">{evaluation.evaluator ? `${evaluation.evaluator.first_name} ${evaluation.evaluator.last_name}` : "—"}</p>
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
                    <p className="text-xs sm:text-sm mt-2">{answer.comment || "Sin comentario"}</p>
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
    </div>
  );
}
