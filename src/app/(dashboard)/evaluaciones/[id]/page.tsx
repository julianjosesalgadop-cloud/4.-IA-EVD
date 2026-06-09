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
        {evaluation && (evaluation.status === "borrador" || evaluation.status === "en_proceso") && (
          <Link href={`/evaluaciones/${evaluation.id}/editar`} className="inline-flex items-center justify-center gap-2 rounded-lg sm:rounded-xl border px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold hover:bg-accent transition-colors flex-shrink-0">
            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
            <span className="hidden sm:inline">Editar</span>
            <span className="sm:hidden">Editar</span>
          </Link>
        )}
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
