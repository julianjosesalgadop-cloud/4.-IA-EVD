"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, ChevronLeft, ChevronRight, Save,
  CheckCircle2, AlertCircle, Star, Info, Send
} from "lucide-react";
import { cn, getScoreLabel, formatScore } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { getEvaluationConfig, saveEvaluation } from "@/app/actions/evaluations";
import { getCollaborators } from "@/app/actions/collaborators";
import type { Collaborator } from "@/types";

// ---- Types ----
interface Question {
  id: string;
  code: string;
  question: string;
  description?: string;
  is_critical: boolean;
  min_score_required: number;
  weight: number;
  is_required: boolean;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  questions: Question[];
  weight: number;
}



const SCORES = [
  { value: 5, label: "Excelente", color: "5" },
  { value: 4, label: "Sobresaliente", color: "4" },
  { value: 3, label: "Cumple", color: "3" },
  { value: 2, label: "Requiere mejora", color: "2" },
  { value: 1, label: "No cumple", color: "1" },
];

// ---- Score Button ----
function ScoreButton({ score, selected, onSelect }: { score: typeof SCORES[0]; selected: boolean; onSelect: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "score-btn flex-shrink-0 min-w-fit",
        selected && `selected-${score.value}`
      )}
      title={score.label}
    >
      <span>{score.value}</span>
      <span>{score.label.split(' ')[0]}</span>
    </motion.button>
  );
}

function NuevaEvaluacionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEvaluateeId = searchParams?.get("collab");

  const [categories, setCategories] = useState<Category[]>([]);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string | null>(initialEvaluateeId);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [evaluationYear, setEvaluationYear] = useState<string>(new Date().getFullYear().toString());

  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { category_id: string, score: number; comment?: string }>>({});
  const [narrativa, setNarrativa] = useState({
    observations: "",
    strengths: "",
    improvement_opportunities: "",
    training_needs: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  useEffect(() => {
    async function loadConfig() {
      try {
        const { categories: cats, questions, version } = await getEvaluationConfig();
        
        if (!cats || !questions) {
          toast.error("No se encontró configuración de evaluación");
          return;
        }
        
        if (version) {
          setVersionId(version.id);
        }
        
        // Group questions into categories
        const structured = cats.map((c: any) => ({
          ...c,
          questions: questions.filter((q: any) => q.category_id === c.id && q.is_active)
        }));
        
        setCategories(structured);
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar configuración de evaluación");
      } finally {
        setIsLoadingConfig(false);
      }
    }
    loadConfig();
  }, []);

  useEffect(() => {
    async function loadCollaborators() {
      try {
        const res = await getCollaborators();
        if (res.error) {
          toast.error("Error al cargar colaboradores");
          return;
        }
        setCollaborators(res.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar colaboradores");
      }
    }
    loadCollaborators();
  }, []);

  const category = categories[currentCategoryIndex];
  const totalCategories = categories.length;
  const isLastCategory = currentCategoryIndex === totalCategories - 1;
  const selectedCollaborator = collaborators.find((c) => c.id === selectedCollaboratorId) ?? null;
  
  // Filter collaborators based on search term
  const filteredCollaborators = collaborators.filter((c) => {
    const fullName = (c.full_name || `${c.first_name || ""} ${c.last_name || ""}`.trim()).toLowerCase();
    const docNumber = (c.document_number || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || docNumber.includes(search);
  });

  // Calculate progress
  const totalQuestions = categories.reduce((sum, c) => sum + c.questions.length, 0);
  const answeredQuestions = Object.keys(answers).length;
  const progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  // Auto-save
  useEffect(() => {
    if (answeredQuestions === 0) return;
    setAutoSaveStatus("unsaved");
    const timer = setTimeout(async () => {
      setAutoSaveStatus("saving");
      await new Promise((r) => setTimeout(r, 500));
      setAutoSaveStatus("saved");
    }, 2000);
    return () => clearTimeout(timer);
  }, [answers, answeredQuestions]);

  const setAnswer = (questionId: string, categoryId: string, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], category_id: categoryId, score } }));
  };

  const setComment = (questionId: string, categoryId: string, comment: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], category_id: categoryId, comment } }));
  };

  // Calculate current category average
  const getCategoryAverage = (cat: Category | undefined) => {
    if (!cat) return null;
    const catAnswers = cat.questions.filter((q) => answers[q.id]?.score);
    if (catAnswers.length === 0) return null;
    const totalWeight = catAnswers.reduce((sum, q) => sum + q.weight, 0);
    const weightedSum = catAnswers.reduce((sum, q) => sum + (answers[q.id]?.score || 0) * q.weight, 0);
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  };

  // Calculate overall average
  const getOverallAverage = () => {
    let totalWeight = 0;
    let weightedSum = 0;
    categories.forEach((cat) => {
      cat.questions.forEach((q) => {
        if (answers[q.id]?.score) {
          totalWeight += q.weight;
          weightedSum += answers[q.id].score * q.weight;
        }
      });
    });
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  };

  const categoryComplete = (cat: Category | undefined) =>
    cat ? cat.questions.filter((q) => q.is_required).every((q) => answers[q.id]?.score) : false;

  const canProceed = category ? categoryComplete(category) : false;

  const handleFinalize = async () => {
    // Check all required
    const allRequired = categories.every(categoryComplete);
    if (!allRequired) {
      toast.error("Hay preguntas obligatorias sin responder");
      return;
    }
    
    if (!selectedCollaboratorId) {
      toast.error("Selecciona el colaborador a evaluar.");
      return;
    }

    setIsSubmitting(true);
    
    const formattedAnswers = Object.entries(answers).map(([question_id, data]) => ({
      question_id,
      category_id: data.category_id,
      score: data.score,
      comment: data.comment,
    }));

    const payload = {
      version_id: versionId,
      evaluatee_id: selectedCollaboratorId,
      answers: formattedAnswers,
      ...narrativa
    };

    const res = await saveEvaluation(payload);
    
    if (res.error) {
      toast.error("Error al guardar la evaluación: " + res.error);
      setIsSubmitting(false);
      return;
    }

    toast.success("Evaluación finalizada exitosamente.");
    router.push("/evaluaciones");
  };

  const overall = getOverallAverage();
  const resultLabel = overall >= 4.0 ? "APROBADO" : overall >= 3.1 ? "PLAN DE MEJORAMIENTO" : overall > 0 ? "NO APROBADO" : null;
  const resultColor = overall >= 4.0 ? "text-success-600" : overall >= 3.1 ? "text-warning-600" : overall > 0 ? "text-danger-600" : "text-muted-foreground";

  return (
    <div className="w-full min-h-screen space-y-4 sm:space-y-6 animate-fade-in px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-4xl mx-auto w-full space-y-4 sm:space-y-6">
      {/* Back */}
      <Link href="/evaluaciones" className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Volver a Evaluaciones</span>
        <span className="sm:hidden">Atrás</span>
      </Link>

      {isLoadingConfig ? (
        <div className="py-12 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-muted-foreground">Cargando configuración de la evaluación...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No hay configuración de evaluación activa.
        </div>
      ) : (
      <>
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Nueva Evaluación de Desempeño</h1>
          {selectedCollaborator && (
            <p className="text-muted-foreground text-xs sm:text-sm mt-1 truncate">
              {selectedCollaborator.full_name} · {selectedCollaborator.position?.name} · {selectedCollaborator.areas?.name || selectedCollaborator.area?.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
          {autoSaveStatus === "saved" && <span className="text-success-500 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Guardado</span>}
          {autoSaveStatus === "saving" && <span className="flex items-center gap-1"><div className="w-3 h-3 border border-muted-foreground/40 border-t-muted-foreground rounded-full animate-spin" /> Guardando...</span>}
          {autoSaveStatus === "unsaved" && <span className="flex items-center gap-1">Sin guardar</span>}
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <div className="space-y-1.5 sm:space-y-2 relative">
          <label className="block text-xs sm:text-sm font-medium">Colaborador a evaluar</label>
          <div className="relative">
            <input
              type="text"
              value={selectedCollaborator ? `${selectedCollaborator.full_name} (${selectedCollaborator.document_number})` : searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Buscar por nombre o documento..."
              className="w-full rounded-lg sm:rounded-xl border bg-background px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {showDropdown && filteredCollaborators.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-lg sm:rounded-xl border border-border bg-popover text-popover-foreground shadow-xl z-50 max-h-40 sm:max-h-56 overflow-y-auto">
                {filteredCollaborators.map((collab) => (
                  <button
                    key={collab.id}
                    type="button"
                    onClick={() => {
                      setSelectedCollaboratorId(collab.id);
                      setSearchTerm("");
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 sm:px-4 sm:py-2.5 hover:bg-accent hover:text-accent-foreground transition-colors border-b border-border/50 last:border-b-0 text-xs sm:text-sm"
                  >
                    <p className="font-medium truncate">{collab.full_name}</p>
                    <p className="text-xs text-muted-foreground/85 truncate">{collab.document_number}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <label className="block text-xs sm:text-sm font-medium">Año de evaluación</label>
          <input
            type="number"
            value={evaluationYear}
            onChange={(e) => setEvaluationYear(e.target.value)}
            min={2020}
            max={new Date().getFullYear()}
            className="w-full rounded-lg sm:rounded-xl border bg-background px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {selectedCollaborator ? (
          <div className="rounded-lg sm:rounded-xl border border-success-200 bg-success-50 dark:bg-success-950/30 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm text-success-700 dark:text-success-400 font-semibold whitespace-nowrap justify-center">
            ✓ Listo
          </div>
        ) : (
          <div className="rounded-lg sm:rounded-xl border border-warning-200 bg-warning-50 dark:bg-warning-950/30 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm text-warning-700 dark:text-warning-400 font-semibold whitespace-nowrap justify-center">
            Seleccionar
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
          <span className="text-muted-foreground truncate">{answeredQuestions}/{totalQuestions} preguntas respondidas</span>
          <span className="font-semibold flex-shrink-0">{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-brand rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Category Nav */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Categorías</p>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-3">
            {categories.map((cat, i) => {
              const catAvg = getCategoryAverage(cat);
              const catComplete = categoryComplete(cat);
              return (
                <button
                  key={cat.id}
                  onClick={() => setCurrentCategoryIndex(i)}
                  className={cn(
                    "text-left p-2 lg:p-3 rounded-xl border transition-all",
                    i === currentCategoryIndex
                      ? "border-primary bg-primary/8 shadow-sm"
                      : "hover:bg-accent border-transparent"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0",
                      catComplete ? "bg-success-500 text-white" : i === currentCategoryIndex ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {catComplete ? "✓" : i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs lg:text-xs font-medium leading-tight line-clamp-2">{cat.name}</p>
                      {catAvg !== null && (
                        <p className={cn(
                          "text-xs font-bold mt-0.5",
                          catAvg >= 4.0 ? "text-success-600" : catAvg >= 3.1 ? "text-warning-600" : "text-danger-600"
                        )}>
                          Prom: {formatScore(catAvg)}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live result */}
          {overall > 0 && (
            <div className="mt-4 p-3 rounded-xl border bg-card col-span-2 lg:col-span-1">
              <p className="text-xs text-muted-foreground mb-1">Promedio actual</p>
              <p className={cn("text-2xl font-bold", resultColor)}>{formatScore(overall)}</p>
              <p className={cn("text-xs font-semibold mt-0.5", resultColor)}>{resultLabel}</p>
            </div>
          )}
        </div>

        {/* Questions Panel */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={category.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl border bg-card overflow-hidden"
            >
              {/* Category Header */}
              <div className="p-3 sm:p-5 border-b bg-muted/20">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">
                        Categoría {currentCategoryIndex + 1} de {totalCategories}
                      </span>
                      <span className="text-xs bg-brand-100 dark:bg-brand-950/30 text-brand-600 px-2 py-0.5 rounded-full flex-shrink-0">
                        Peso: {category.weight}%
                      </span>
                    </div>
                    <h2 className="font-semibold text-base sm:text-lg">{category.name}</h2>
                    {category.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">{category.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="divide-y divide-border">
                {category.questions.map((question, qi) => (
                  <div key={question.id} className="p-3 sm:p-5 space-y-3 sm:space-y-4">
                    {/* Question Header */}
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="flex-shrink-0 text-xs font-bold text-muted-foreground bg-muted w-6 h-4 sm:w-8 sm:h-5 rounded flex items-center justify-center">
                        {question.code}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                          <p className="text-xs sm:text-sm font-medium leading-relaxed">
                            {question.question}
                            {question.is_required && <span className="text-danger-500 ml-1">*</span>}
                          </p>
                          {question.is_critical && (
                            <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-danger-100 dark:bg-danger-950/30 text-danger-600 border border-danger-200 whitespace-nowrap">
                              <AlertCircle className="w-3 h-3" />
                              Crítico ≥{question.min_score_required}
                            </span>
                          )}
                        </div>
                        {question.description && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {question.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Score Buttons */}
                    <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1">
                      {SCORES.map((score) => (
                        <ScoreButton
                          key={score.value}
                          score={score}
                          selected={answers[question.id]?.score === score.value}
                          onSelect={() => setAnswer(question.id, category.id, score.value)}
                        />
                      ))}
                    </div>

                    {/* Critical warning */}
                    {question.is_critical && answers[question.id]?.score && answers[question.id].score < question.min_score_required && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2 p-2 sm:p-3 rounded-lg bg-danger-50 dark:bg-danger-950/20 border border-danger-200 text-danger-600 text-xs"
                      >
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p>
                          <strong>Criterio crítico incumplido:</strong> La calificación mínima requerida es {question.min_score_required}.
                          Se generará un Plan de Mejoramiento automáticamente.
                        </p>
                      </motion.div>
                    )}

                    {/* Comment */}
                    {answers[question.id]?.score && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.2 }}
                      >
                        <textarea
                          value={answers[question.id]?.comment || ""}
                          onChange={(e) => setComment(question.id, category.id, e.target.value)}
                          placeholder="Observación opcional sobre esta calificación..."
                          rows={2}
                          className="w-full rounded-lg border bg-background/50 px-2 sm:px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground"
                        />
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Narrative (last category) */}
          {isLastCategory && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 sm:mt-6 rounded-xl border bg-card p-3 sm:p-5 space-y-4"
            >
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                <Star className="w-4 sm:w-5 h-4 sm:h-5 text-brand-500 flex-shrink-0" />
                Narrativa de la Evaluación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-medium">Fortalezas identificadas</label>
                  <textarea
                    value={narrativa.strengths}
                    onChange={(e) => setNarrativa((p) => ({ ...p, strengths: e.target.value }))}
                    rows={3}
                    placeholder="Describe las principales fortalezas del colaborador..."
                    className="w-full rounded-lg border bg-background px-2 sm:px-3 py-2 text-xs sm:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-medium">Oportunidades de mejora</label>
                  <textarea
                    value={narrativa.improvement_opportunities}
                    onChange={(e) => setNarrativa((p) => ({ ...p, improvement_opportunities: e.target.value }))}
                    rows={3}
                    placeholder="Describe las áreas de mejora identificadas..."
                    className="w-full rounded-lg border bg-background px-2 sm:px-3 py-2 text-xs sm:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-medium">Necesidades de capacitación</label>
                  <textarea
                    value={narrativa.training_needs}
                    onChange={(e) => setNarrativa((p) => ({ ...p, training_needs: e.target.value }))}
                    rows={3}
                    placeholder="Temas de capacitación requeridos..."
                    className="w-full rounded-lg border bg-background px-2 sm:px-3 py-2 text-xs sm:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-medium">Observaciones generales</label>
                  <textarea
                    value={narrativa.observations}
                    onChange={(e) => setNarrativa((p) => ({ ...p, observations: e.target.value }))}
                    rows={3}
                    placeholder="Observaciones adicionales del evaluador..."
                    className="w-full rounded-lg border bg-background px-2 sm:px-3 py-2 text-xs sm:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Navigation */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mt-4">
            <button
              onClick={() => setCurrentCategoryIndex((i) => i - 1)}
              disabled={currentCategoryIndex === 0}
              className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2 rounded-xl border text-xs sm:text-sm font-medium hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
              <span className="sm:hidden">Ant.</span>
            </button>

            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
              <button
                type="button"
                onClick={() => toast.success("Borrador guardado")}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl border text-xs sm:text-sm font-medium hover:bg-accent transition-colors"
              >
                <Save className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                <span className="hidden sm:inline">Guardar borrador</span>
                <span className="sm:hidden">Guardar</span>
              </button>

              {isLastCategory ? (
                <button
                  onClick={handleFinalize}
                  disabled={isSubmitting || progress < 100}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 rounded-xl gradient-brand text-white text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 flex-1 sm:flex-none justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 sm:w-4 h-3.5 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="hidden sm:inline">Finalizando...</span>
                      <span className="sm:hidden">Finalizar</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                      <span className="hidden sm:inline">Finalizar Evaluación</span>
                      <span className="sm:hidden">Finalizar</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentCategoryIndex((i) => i + 1)}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 rounded-xl gradient-brand text-white text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity shadow-md flex-1 sm:flex-none"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <span className="sm:hidden">Sig.</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      </>
      )}
      </div>
    </div>
  );
}

export default function NuevaEvaluacionPage() {
  return (
    <Suspense fallback={
      <div className="py-12 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Cargando formulario...</p>
      </div>
    }>
      <NuevaEvaluacionContent />
    </Suspense>
  );
}
