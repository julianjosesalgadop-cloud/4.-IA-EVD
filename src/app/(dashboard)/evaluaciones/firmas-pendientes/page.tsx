"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PenTool, 
  Search, 
  FileText, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  AlertTriangle,
  Calendar,
  User,
  Award,
  CheckCircle,
  FileSignature
} from "lucide-react";
import { toast } from "sonner";
import { cn, getResultLabel, formatScore, getScoreLabel, formatDate, formatDateTime, getStatusLabel } from "@/lib/utils";
import { SignatureInput } from "@/components/ui/signature-input";
import { 
  getPendingSignatureEvaluations, 
  completeCollaboratorSignature, 
  getEvaluationById 
} from "@/app/actions/evaluations";

// Define evaluation interface based on schema
interface Evaluation {
  id: string;
  code: string;
  evaluation_year: number;
  evaluation_date: string;
  created_at: string;
  status: string;
  evaluator_id: string;
  evaluatee_id: string;
  strengths?: string;
  improvement_opportunities?: string;
  training_needs?: string;
  observations?: string;
  collaborator: any;
  evaluator: any;
  result: any;
}

export default function FirmasPendientesPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [habeasData, setHabeasData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNarratives, setShowNarratives] = useState(false);

  // Load Data
  const loadEvaluations = async () => {
    setLoading(true);
    try {
      const { data, error } = await getPendingSignatureEvaluations();
      if (error) {
        toast.error("Error al cargar evaluaciones", { description: error });
      } else {
        setEvaluations(data || []);
      }
    } catch (err) {
      toast.error("Error inesperado al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvaluations();
  }, []);

  // Calculate Days Pending
  const getDaysPending = (createdAt: string) => {
    const start = new Date(createdAt);
    const end = new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const isToday = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // KPIs
  const totalPendientes = evaluations.length;
  const pendientesHoy = evaluations.filter(e => isToday(e.created_at)).length;
  const masDe7Dias = evaluations.filter(e => getDaysPending(e.created_at) > 7).length;

  // Helper getters
  const getCollabObj = (collab: any) => {
    return Array.isArray(collab) ? collab[0] : collab;
  };

  // Filtering
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(ev => {
      const search = searchTerm.toLowerCase();
      const col = getCollabObj(ev.collaborator);
      const nameMatch = col?.full_name?.toLowerCase().includes(search);
      const docMatch = col?.document_number?.toLowerCase().includes(search);
      return nameMatch || docMatch;
    });
  }, [evaluations, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredEvaluations.length / itemsPerPage) || 1;
  const paginatedEvaluations = filteredEvaluations.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Helper getters
  const getCollabPosition = (collab: any) => {
    const c = getCollabObj(collab);
    return Array.isArray(c?.position) ? c.position[0]?.name : c?.position?.name || "N/A";
  };
  const getCollabArea = (collab: any) => {
    const c = getCollabObj(collab);
    return Array.isArray(c?.areas) ? c.areas[0]?.name : c?.areas?.name || "N/A";
  };
  const getResultObj = (result: any) => {
    return Array.isArray(result) ? result[0] : result;
  };

  // Colors for result and average
  const getResultBadgeStyles = (result: string) => {
    switch(result) {
      case 'aprobado': return 'bg-success/10 text-success border-success/20';
      case 'plan_mejoramiento': return 'bg-warning/10 text-warning-foreground border-warning/20';
      case 'no_aprobado': return 'bg-danger/10 text-danger border-danger/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.0) return 'text-success';
    if (score >= 3.1) return 'text-warning-foreground';
    return 'text-danger';
  };

  // Handle open modal
  const handleOpenModal = (ev: Evaluation) => {
    setSelectedEval(ev);
    setSignature(null);
    setHabeasData(false);
    setShowNarratives(false);
    setIsModalOpen(true);
  };

  // Handle signature submit
  const handleSubmitSignature = async () => {
    if (!selectedEval || !signature || !habeasData) return;
    
    setIsSubmitting(true);
    try {
      const { success, error } = await completeCollaboratorSignature(selectedEval.id, signature);
      if (success) {
        toast.success("Firma guardada correctamente", {
          description: "La evaluación ha finalizado exitosamente."
        });
        setIsModalOpen(false);
        loadEvaluations();
      } else {
        toast.error("Error al guardar la firma", { description: error });
      }
    } catch (err) {
      toast.error("Error inesperado al procesar la firma");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <PenTool className="w-6 h-6 text-brand" />
          Firmas Pendientes
        </h1>
        <p className="text-muted-foreground">
          Evaluaciones completadas que requieren la firma del colaborador
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="rounded-2xl border bg-card p-5 shadow-sm flex flex-col gap-1 border-l-4 border-l-warning"
        >
          <div className="flex items-center gap-2 text-warning-foreground/80">
            <FileSignature className="w-4 h-4" />
            <span className="text-sm font-medium">Total Pendientes</span>
          </div>
          <span className="text-3xl font-bold">{totalPendientes}</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="rounded-2xl border bg-card p-5 shadow-sm flex flex-col gap-1 border-l-4 border-l-brand"
        >
          <div className="flex items-center gap-2 text-brand/80">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">Pendientes Hoy</span>
          </div>
          <span className="text-3xl font-bold">{pendientesHoy}</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
          className="rounded-2xl border bg-card p-5 shadow-sm flex flex-col gap-1 border-l-4 border-l-danger"
        >
          <div className="flex items-center gap-2 text-danger/80">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Más de 7 días</span>
          </div>
          <span className="text-3xl font-bold text-danger">{masDe7Dias}</span>
        </motion.div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre o documento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-10 pl-9 pr-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
        />
      </div>

      {/* Table Section */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-3 h-full">
              <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
              <p>Cargando evaluaciones...</p>
            </div>
          ) : paginatedEvaluations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-3 h-full">
              <FileSignature className="w-12 h-12 opacity-20" />
              <p>No hay firmas pendientes en este momento.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 whitespace-nowrap">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Código EVD</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Colaborador</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Cargo / Área</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Promedio</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Resultado</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Días Pendiente</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedEvaluations.map((ev) => {
                  const resultObj = getResultObj(ev.result);
                  const average = resultObj?.overall_average || 0;
                  const resultStr = resultObj?.result || 'N/A';
                  const daysPending = getDaysPending(ev.created_at);
                  
                  const collab = getCollabObj(ev.collaborator);
                  
                  return (
                    <tr key={ev.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{ev.code}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground truncate max-w-[150px] sm:max-w-[200px]">
                            {collab?.full_name || "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {collab?.document_number || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex flex-col max-w-[200px]">
                          <span className="truncate">{getCollabPosition(collab)}</span>
                          <span className="text-xs text-muted-foreground truncate">{getCollabArea(collab)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        <span className={getScoreColor(average)}>{formatScore(average)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded border whitespace-nowrap", getResultBadgeStyles(resultStr))}>
                          {getResultLabel(resultStr)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell whitespace-nowrap">
                        {formatDate(ev.evaluation_date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full w-fit",
                          daysPending > 7 ? "bg-danger/10 text-danger" : 
                          daysPending > 3 ? "bg-warning/10 text-warning-foreground" : 
                          "bg-muted text-muted-foreground"
                        )}>
                          <Clock className="w-3.5 h-3.5" />
                          {daysPending} {daysPending === 1 ? 'día' : 'días'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleOpenModal(ev)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-brand text-brand-foreground text-xs font-medium rounded-lg hover:bg-brand/90 transition-colors"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          <span>Firmar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && evaluations.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
            <span className="text-xs text-muted-foreground hidden sm:block">
              Mostrando {(page - 1) * itemsPerPage + 1}-{Math.min(page * itemsPerPage, filteredEvaluations.length)} de {filteredEvaluations.length}
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)} 
                className="px-3 py-1.5 rounded-lg border bg-background text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                Anterior
              </button>
              <span className="text-xs font-medium px-3 sm:hidden text-muted-foreground">
                {page} / {totalPages}
              </span>
              <span className="px-3 py-1.5 text-sm hidden sm:block text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <button 
                disabled={page === totalPages} 
                onClick={() => setPage(p => p + 1)} 
                className="px-3 py-1.5 rounded-lg border bg-background text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Signature Modal */}
      <AnimatePresence>
        {isModalOpen && selectedEval && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm sm:p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                    <PenTool className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Firma del Colaborador</h2>
                    <p className="text-xs text-muted-foreground">EVD: {selectedEval.code}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                
                {/* Summary Card */}
                <div className="bg-muted/30 rounded-xl p-4 sm:p-5 border space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(() => {
                      const modalCollab = getCollabObj(selectedEval.collaborator);
                      return (
                        <>
                          <div className="flex gap-3">
                            <User className="w-5 h-5 text-muted-foreground shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Colaborador</p>
                              <p className="font-semibold">{modalCollab?.full_name || "—"}</p>
                              <p className="text-sm text-muted-foreground">{modalCollab?.document_number || "—"}</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <Award className="w-5 h-5 text-muted-foreground shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Cargo y Área</p>
                              <p className="font-semibold line-clamp-1">{getCollabPosition(modalCollab)}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">{getCollabArea(modalCollab)}</p>
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    <div className="flex gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Fecha Evaluación</p>
                        <p className="font-semibold">{formatDate(selectedEval.evaluation_date)}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Resultado Final</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("text-lg font-bold", getScoreColor(getResultObj(selectedEval.result)?.overall_average || 0))}>
                            {formatScore(getResultObj(selectedEval.result)?.overall_average || 0)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({getScoreLabel(getResultObj(selectedEval.result)?.overall_average || 0)})
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className={cn("text-xs font-bold px-2 py-0.5 rounded border inline-block", getResultBadgeStyles(getResultObj(selectedEval.result)?.result || 'N/A'))}>
                            {getResultLabel(getResultObj(selectedEval.result)?.result || 'N/A')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collapsible Narrative Section */}
                <div className="border rounded-xl overflow-hidden bg-card">
                  <button 
                    onClick={() => setShowNarratives(!showNarratives)}
                    className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <FileText className="w-4 h-4 text-brand" />
                      Detalles de la Evaluación
                    </div>
                    {showNarratives ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  
                  <AnimatePresence>
                    {showNarratives && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 border-t space-y-4 text-sm">
                          {selectedEval.strengths && (
                            <div>
                              <h4 className="font-semibold text-foreground mb-1">Fortalezas</h4>
                              <p className="text-muted-foreground whitespace-pre-wrap">{selectedEval.strengths}</p>
                            </div>
                          )}
                          {selectedEval.improvement_opportunities && (
                            <div>
                              <h4 className="font-semibold text-foreground mb-1">Oportunidades de Mejora</h4>
                              <p className="text-muted-foreground whitespace-pre-wrap">{selectedEval.improvement_opportunities}</p>
                            </div>
                          )}
                          {selectedEval.training_needs && (
                            <div>
                              <h4 className="font-semibold text-foreground mb-1">Necesidades de Capacitación</h4>
                              <p className="text-muted-foreground whitespace-pre-wrap">{selectedEval.training_needs}</p>
                            </div>
                          )}
                          {selectedEval.observations && (
                            <div>
                              <h4 className="font-semibold text-foreground mb-1">Observaciones</h4>
                              <p className="text-muted-foreground whitespace-pre-wrap">{selectedEval.observations}</p>
                            </div>
                          )}
                          {!selectedEval.strengths && !selectedEval.improvement_opportunities && !selectedEval.training_needs && !selectedEval.observations && (
                            <p className="text-muted-foreground italic">No hay comentarios adicionales registrados.</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Signature Input Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold border-b pb-2">Registro de Firma</h3>
                  
                  <div className="border-2 border-dashed rounded-xl p-2 bg-muted/10 max-w-md mx-auto">
                    <SignatureInput
                      value={signature}
                      onChange={setSignature}
                      placeholder="Firme aquí con el mouse o dedo"
                    />
                  </div>

                  <label className="flex items-start gap-3 p-4 rounded-xl border bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors">
                    <input 
                      type="checkbox" 
                      className="mt-1 w-4 h-4 rounded border-muted-foreground/30 text-brand focus:ring-brand"
                      checked={habeasData}
                      onChange={(e) => setHabeasData(e.target.checked)}
                    />
                    <span className="text-sm text-muted-foreground leading-snug">
                      Acepto la política de tratamiento de datos personales (Habeas Data) para el registro, almacenamiento y uso de mi firma digital en esta evaluación de desempeño.{' '}
                      <a 
                        href="https://flotasugamuxisa.com.co/privacidad/#habeas-data" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-brand hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Leer política
                      </a>
                    </span>
                  </label>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-6 border-t bg-muted/10 flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-medium text-sm rounded-xl border bg-background hover:bg-muted transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmitSignature}
                  disabled={!signature || !habeasData || isSubmitting}
                  className="px-6 py-2 font-medium text-sm rounded-xl bg-brand text-brand-foreground hover:bg-brand/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Aceptar y Finalizar</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
