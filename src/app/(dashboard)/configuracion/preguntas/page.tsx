"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Settings, Plus, GripVertical, Edit, Trash2, Eye, EyeOff,
  AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Search,
  Copy, Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ---- Types ----
interface Question {
  id: string;
  code: string;
  question: string;
  description?: string;
  is_required: boolean;
  is_active: boolean;
  is_critical: boolean;
  min_score_required: number;
  weight: number;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  weight: number;
  active: boolean;
  questions: Question[];
}

const initialCategories: Category[] = [
  {
    id: "cat1",
    name: "Cumplimiento de Funciones y Responsabilidades",
    description: "Evalúa el nivel de cumplimiento de las funciones asignadas al cargo",
    sort_order: 1,
    weight: 25,
    active: true,
    questions: [
      { id: "q1", code: "CF-01", question: "Cumple con las funciones y tareas asignadas a su cargo de manera oportuna", is_required: true, is_active: true, is_critical: false, min_score_required: 1, weight: 1 },
      { id: "q2", code: "CF-02", question: "Demuestra conocimiento técnico suficiente para el desempeño de su cargo", is_required: true, is_active: true, is_critical: false, min_score_required: 1, weight: 1 },
      { id: "q3", code: "CF-03", question: "Organiza y prioriza adecuadamente sus actividades para alcanzar los objetivos", is_required: true, is_active: true, is_critical: false, min_score_required: 1, weight: 1 },
    ],
  },
  {
    id: "cat2",
    name: "Seguridad y Salud en el Trabajo",
    description: "Compromiso con las normas de SST y autocuidado",
    sort_order: 2,
    weight: 20,
    active: true,
    questions: [
      { id: "q4", code: "SST-01", question: "Usa adecuada y permanentemente los elementos de protección personal (EPP)", is_required: true, is_active: true, is_critical: true, min_score_required: 3, weight: 1.5 },
      { id: "q5", code: "SST-02", question: "Cumple con los procedimientos y protocolos de seguridad definidos", is_required: true, is_active: true, is_critical: true, min_score_required: 3, weight: 1.5 },
    ],
  },
];

// ---- Question Row ----
function QuestionRow({ question, onEdit, onDelete, onToggle, onDuplicate }: {
  question: Question;
  onEdit: (q: Question) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onDuplicate: (q: Question) => void;
}) {
  return (
    <Reorder.Item
      value={question}
      id={question.id}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-background transition-all",
        !question.is_active && "opacity-50"
      )}
    >
      {/* Drag handle */}
      <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Code */}
      <span className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground w-16 text-center flex-shrink-0">
        {question.code}
      </span>

      {/* Question */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{question.question}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {question.is_critical && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-danger-600 bg-danger-50 dark:bg-danger-950/30 px-1.5 py-0.5 rounded-full border border-danger-200">
              <AlertCircle className="w-3 h-3" />
              Crítico · Mín {question.min_score_required}
            </span>
          )}
          {question.is_required && (
            <span className="text-[10px] text-muted-foreground">Obligatoria</span>
          )}
          <span className="text-[10px] text-muted-foreground">Peso: {question.weight}x</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onDuplicate(question)}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title="Duplicar"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onEdit(question)}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title="Editar"
        >
          <Edit className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onToggle(question.id)}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            question.is_active ? "hover:bg-warning-50 text-warning-500" : "hover:bg-success-50 text-success-500"
          )}
          title={question.is_active ? "Inactivar" : "Activar"}
        >
          {question.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => onDelete(question.id)}
          className="p-1.5 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-950/30 text-muted-foreground hover:text-danger-600 transition-colors"
          title="Eliminar"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </Reorder.Item>
  );
}

// ---- Category Panel ----
function CategoryPanel({ category, onUpdateQuestions }: {
  category: Category;
  onUpdateQuestions: (catId: string, questions: Question[]) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [questions, setQuestions] = useState(category.questions);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ question: "", code: "", is_critical: false, min_score_required: 1, weight: 1 });

  const handleReorder = (newOrder: Question[]) => {
    setQuestions(newOrder);
    onUpdateQuestions(category.id, newOrder);
  };

  const handleToggle = (id: string) => {
    const updated = questions.map(q => q.id === id ? { ...q, is_active: !q.is_active } : q);
    setQuestions(updated);
    onUpdateQuestions(category.id, updated);
  };

  const handleDelete = (id: string) => {
    const updated = questions.filter(q => q.id !== id);
    setQuestions(updated);
    onUpdateQuestions(category.id, updated);
    toast.success("Pregunta eliminada");
  };

  const handleDuplicate = (q: Question) => {
    const dup: Question = { ...q, id: Date.now().toString(), code: `${q.code}-COPIA` };
    const updated = [...questions, dup];
    setQuestions(updated);
    onUpdateQuestions(category.id, updated);
    toast.success("Pregunta duplicada");
  };

  const handleAddQuestion = () => {
    if (!newQuestion.question.trim()) {
      toast.error("La pregunta no puede estar vacía");
      return;
    }
    const q: Question = {
      id: Date.now().toString(),
      code: newQuestion.code || `Q-${questions.length + 1}`,
      question: newQuestion.question,
      is_required: true,
      is_active: true,
      is_critical: newQuestion.is_critical,
      min_score_required: newQuestion.min_score_required,
      weight: newQuestion.weight,
    };
    const updated = [...questions, q];
    setQuestions(updated);
    onUpdateQuestions(category.id, updated);
    setNewQuestion({ question: "", code: "", is_critical: false, min_score_required: 1, weight: 1 });
    setShowAddForm(false);
    toast.success("Pregunta agregada exitosamente");
  };

  const activeCount = questions.filter(q => q.is_active).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card overflow-hidden"
    >
      {/* Category Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {category.sort_order}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{category.name}</p>
          <p className="text-xs text-muted-foreground">{activeCount}/{questions.length} preguntas activas · Peso {category.weight}%</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium",
            category.active ? "bg-success-50 text-success-600 dark:bg-success-950/30" : "bg-muted text-muted-foreground"
          )}>
            {category.active ? "Activa" : "Inactiva"}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t"
          >
            <div className="p-4 space-y-2">
              {/* Drag hint */}
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
                <GripVertical className="w-3.5 h-3.5" />
                Arrastra las preguntas para reordenarlas
              </p>

              <Reorder.Group
                axis="y"
                values={questions}
                onReorder={handleReorder}
                className="space-y-2"
              >
                {questions.map((q) => (
                  <QuestionRow
                    key={q.id}
                    question={q}
                    onEdit={(q) => toast.info(`Editando: ${q.code}`)}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                    onDuplicate={handleDuplicate}
                  />
                ))}
              </Reorder.Group>

              {/* Add Question Form */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-3 p-4 rounded-xl border border-dashed border-primary/50 bg-primary/3 space-y-3"
                  >
                    <p className="text-sm font-semibold text-primary">Nueva Pregunta</p>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Código</label>
                        <input
                          value={newQuestion.code}
                          onChange={(e) => setNewQuestion(p => ({ ...p, code: e.target.value }))}
                          placeholder="CF-06"
                          className="w-full h-9 rounded-lg border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Pregunta *</label>
                        <input
                          value={newQuestion.question}
                          onChange={(e) => setNewQuestion(p => ({ ...p, question: e.target.value }))}
                          placeholder="Escribe la pregunta..."
                          className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newQuestion.is_critical}
                          onChange={(e) => setNewQuestion(p => ({ ...p, is_critical: e.target.checked }))}
                          className="rounded"
                        />
                        <span className="text-danger-600 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Criterio crítico
                        </span>
                      </label>
                      {newQuestion.is_critical && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Nota mínima:</span>
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={newQuestion.min_score_required}
                            onChange={(e) => setNewQuestion(p => ({ ...p, min_score_required: Number(e.target.value) }))}
                            className="w-16 h-7 rounded border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Peso:</span>
                        <input
                          type="number"
                          min={0.5}
                          max={5}
                          step={0.5}
                          value={newQuestion.weight}
                          onChange={(e) => setNewQuestion(p => ({ ...p, weight: Number(e.target.value) }))}
                          className="w-16 h-7 rounded border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAddQuestion}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg gradient-brand text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Agregar pregunta
                      </button>
                      <button
                        onClick={() => setShowAddForm(false)}
                        className="px-4 py-1.5 rounded-lg border text-xs hover:bg-accent transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 w-full p-3 rounded-lg border border-dashed text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-accent/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Agregar pregunta a esta categoría
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---- Main Page ----
export default function PreguntasConfigPage() {
  const [categories, setCategories] = useState(initialCategories);
  const [searchQ, setSearchQ] = useState("");

  const updateQuestions = (catId: string, questions: Question[]) => {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, questions } : c));
  };

  const totalQuestions = categories.reduce((sum, c) => sum + c.questions.length, 0);
  const activeQuestions = categories.reduce((sum, c) => sum + c.questions.filter(q => q.is_active).length, 0);
  const criticalQuestions = categories.reduce((sum, c) => sum + c.questions.filter(q => q.is_critical).length, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuración de Preguntas</h1>
          <p className="text-muted-foreground text-sm mt-1">Versión 2026 · Motor de evaluación dinámico</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm hover:bg-accent transition-colors">
            <Star className="w-4 h-4" />
            Criterios críticos
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md">
            <Plus className="w-4 h-4" />
            Nueva categoría
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-brand-200 bg-brand-50 dark:bg-brand-950/20">
        <Settings className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0 animate-spin-slow" />
        <div className="text-sm">
          <p className="font-semibold text-brand-700 dark:text-brand-400">Motor de evaluación dinámico</p>
          <p className="text-brand-600/80 dark:text-brand-400/80 text-xs mt-0.5">
            Las preguntas configuradas aquí se cargan automáticamente al crear una evaluación.
            Puedes agregar, reordenar o inactivar preguntas sin afectar las evaluaciones históricas.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total preguntas", value: totalQuestions },
          { label: "Activas", value: activeQuestions },
          { label: "Criterios críticos", value: criticalQuestions },
        ].map((s, i) => (
          <div key={s.label} className="p-4 rounded-xl border bg-card text-center">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Buscar pregunta..."
          className="w-full h-10 pl-10 pr-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
      </div>

      {/* Categories + Questions */}
      <div className="space-y-4">
        {categories.map((cat) => (
          <CategoryPanel
            key={cat.id}
            category={cat}
            onUpdateQuestions={updateQuestions}
          />
        ))}
      </div>
    </div>
  );
}
