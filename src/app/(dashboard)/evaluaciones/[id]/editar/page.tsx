"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Edit, FileText } from "lucide-react";
import { toast } from "sonner";
import { getEvaluationById, updateEvaluation } from "@/app/actions/evaluations";
import { formatDate, getStatusLabel } from "@/lib/utils";

const statusOptions = [
  { value: "borrador", label: "Borrador" },
  { value: "en_proceso", label: "En proceso" },
  { value: "finalizada", label: "Finalizada" },
];

export default function EvaluationEditPage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params?.id as string;
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    status: "borrador",
    observations: "",
    strengths: "",
    improvement_opportunities: "",
    training_needs: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!evaluationId) return;

    async function loadEvaluation() {
      setLoading(true);
      const res = await getEvaluationById(evaluationId);
      if (res.error) {
        setError(res.error);
        toast.error("No se pudo cargar la evaluación.");
      } else {
        setEvaluation(res.data);
        setForm({
          status: res.data.status || "borrador",
          observations: res.data.observations || "",
          strengths: res.data.strengths || "",
          improvement_opportunities: res.data.improvement_opportunities || "",
          training_needs: res.data.training_needs || "",
        });
      }
      setLoading(false);
    }

    loadEvaluation();
  }, [evaluationId]);

  const isFinalized = useMemo(() => evaluation?.status === "finalizada", [evaluation]);

  const handleChange = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!evaluationId) return;
    setSaving(true);
    const res = await updateEvaluation(evaluationId, {
      status: form.status,
      observations: form.observations,
      strengths: form.strengths,
      improvement_opportunities: form.improvement_opportunities,
      training_needs: form.training_needs,
    });
    setSaving(false);

    if (res.error) {
      toast.error("Error al guardar: " + res.error);
      return;
    }

    toast.success("Evaluación actualizada correctamente.");
    router.push(`/evaluaciones/${evaluationId}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href={`/evaluaciones/${evaluationId || ""}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver a detalles
          </Link>
          <h1 className="text-2xl font-bold mt-4">Editar Evaluación</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          Estado actual: <span className="font-semibold">{evaluation ? getStatusLabel(evaluation.status) : "—"}</span>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">Cargando evaluación...</div>
      ) : error ? (
        <div className="rounded-xl border bg-card p-8 text-center text-danger-600">{error}</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <select
                  value={form.status}
                  onChange={(event) => handleChange("status", event.target.value)}
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Creado</label>
                <p className="text-sm text-muted-foreground">{formatDate(evaluation.created_at)}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Evaluador</label>
                <p className="text-sm text-muted-foreground">{evaluation.evaluator?.first_name} {evaluation.evaluator?.last_name}</p>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Colaborador</label>
                <p className="text-sm text-muted-foreground">{evaluation.collaborator?.full_name}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Versión</label>
                <p className="text-sm text-muted-foreground">{evaluation.version?.name}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Finalizado</label>
                <p className="text-sm text-muted-foreground">{evaluation.finalized_at ? formatDate(evaluation.finalized_at) : "—"}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <label className="text-sm font-medium">Observaciones</label>
              <textarea
                value={form.observations}
                onChange={(event) => handleChange("observations", event.target.value)}
                className="w-full min-h-[120px] rounded-lg border p-3 bg-background"
                disabled={isFinalized}
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">Fortalezas</label>
              <textarea
                value={form.strengths}
                onChange={(event) => handleChange("strengths", event.target.value)}
                className="w-full min-h-[120px] rounded-lg border p-3 bg-background"
                disabled={isFinalized}
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <label className="text-sm font-medium">Oportunidades de mejora</label>
              <textarea
                value={form.improvement_opportunities}
                onChange={(event) => handleChange("improvement_opportunities", event.target.value)}
                className="w-full min-h-[120px] rounded-lg border p-3 bg-background"
                disabled={isFinalized}
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">Necesidades de formación</label>
              <textarea
                value={form.training_needs}
                onChange={(event) => handleChange("training_needs", event.target.value)}
                className="w-full min-h-[120px] rounded-lg border p-3 bg-background"
                disabled={isFinalized}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Respuestas no se pueden editar desde esta pantalla</p>
                <p className="text-sm text-muted-foreground">Para cambiar preguntas debe usar la evaluación original o reiniciar el proceso.</p>
              </div>
              <button
                type="submit"
                disabled={saving || isFinalized}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" /> Guardar cambios
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
