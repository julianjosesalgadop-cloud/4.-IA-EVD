"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User, Briefcase, GitBranch, CheckCircle2,
  ArrowLeft, ArrowRight, Save, ChevronLeft
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getAreas, getPositions } from "@/app/actions/config";
import { getProfiles } from "@/app/actions/admin";

// ---- Wizard Steps ----
const STEPS = [
  { id: 1, title: "Información Personal", icon: User, description: "Datos de identificación y contacto" },
  { id: 2, title: "Información Laboral", icon: Briefcase, description: "Cargo, área y contrato" },
  { id: 3, title: "Jerarquía", icon: GitBranch, description: "Jefe inmediato y responsables" },
  { id: 4, title: "Confirmación", icon: CheckCircle2, description: "Revisión y guardado" },
];

// ---- Zod Schemas per step ----
const step1Schema = z.object({
  document_type: z.enum(["CC", "CE", "TI", "PP", "NIT", "RUT"]),
  document_number: z.string().min(5, "Número de documento inválido").max(20),
  first_name: z.string().min(2, "Nombre requerido").max(100),
  last_name: z.string().min(2, "Apellido requerido").max(100),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  gender: z.enum(["masculino", "femenino", "otro", "no_informa"]).optional(),
});

const step2Schema = z.object({
  area_id: z.string().min(1, "Selecciona un área"),
  position_id: z.string().min(1, "Selecciona un cargo"),
  status: z.enum(["activo", "inactivo", "retirado", "vacaciones", "incapacidad"]),
  workplace_city: z.string().optional().or(z.literal("")),
  hire_date: z.string().optional().or(z.literal("")),
});

const step3Schema = z.object({
  immediate_boss_id: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

// ---- Step Components ----
function StepPersonal({ form }: { form: ReturnType<typeof useForm<Step1Data>> }) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Tipo de Documento *</label>
          <select
            {...register("document_type")}
            className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="CC">Cédula de Ciudadanía</option>
            <option value="CE">Cédula de Extranjería</option>
            <option value="TI">Tarjeta de Identidad</option>
            <option value="PP">Pasaporte</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Número de Documento *</label>
          <input
            {...register("document_number")}
            placeholder="Ej: 19234567"
            className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {errors.document_number && <p className="text-danger-500 text-xs">{errors.document_number.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nombres *</label>
          <input
            {...register("first_name")}
            placeholder="Ej: Carlos Alberto"
            className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {errors.first_name && <p className="text-danger-500 text-xs">{errors.first_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Apellidos *</label>
          <input
            {...register("last_name")}
            placeholder="Ej: Martínez Rojas"
            className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {errors.last_name && <p className="text-danger-500 text-xs">{errors.last_name.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Correo Electrónico</label>
          <input
            {...register("email")}
            type="email"
            placeholder="correo@empresa.com"
            className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Celular</label>
          <input
            {...register("phone")}
            placeholder="3001234567"
            className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Género</label>
        <select
          {...register("gender")}
          className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Seleccionar...</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
          <option value="otro">Otro</option>
          <option value="no_informa">No informa</option>
        </select>
      </div>
    </div>
  );
}

function StepLaboral({ 
  form, 
  areas, 
  positions 
}: { 
  form: ReturnType<typeof useForm<Step2Data>>,
  areas: any[],
  positions: any[]
}) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Área *</label>
          <select
            {...register("area_id")}
            className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Seleccionar área...</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>{area.name}</option>
            ))}
          </select>
          {errors.area_id && <p className="text-danger-500 text-xs">{errors.area_id.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Cargo *</label>
          <select
            {...register("position_id")}
            className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Seleccionar cargo...</option>
            {positions.map((pos) => (
              <option key={pos.id} value={pos.id}>{pos.name}</option>
            ))}
          </select>
          {errors.position_id && <p className="text-danger-500 text-xs">{errors.position_id.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Sede / Ciudad</label>
          <input
            {...register("workplace_city")}
            placeholder="Ej: Sogamoso"
            className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Fecha de Ingreso</label>
          <input
            {...register("hire_date")}
            type="date"
            className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Estado</label>
        <select
          {...register("status")}
          className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
          <option value="vacaciones">Vacaciones</option>
          <option value="incapacidad">Incapacidad</option>
        </select>
      </div>
    </div>
  );
}

function StepJerarquia({ 
  form,
  collaborators
}: { 
  form: ReturnType<typeof useForm<Step3Data>>,
  collaborators: any[]
}) {
  const { setValue, watch } = form;
  const selectedBossId = watch("immediate_boss_id");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Find currently selected boss
  const selectedBoss = collaborators.find(c => c.id === selectedBossId);

  // Filter collaborators by name, document number, or position
  const filtered = collaborators.filter((c) => {
    const term = searchTerm.toLowerCase();
    const fullName = (c.full_name || "").toLowerCase();
    const docNumber = (c.document_number || "").toLowerCase();
    const positionName = (c.positions?.name || "").toLowerCase();
    return fullName.includes(term) || docNumber.includes(term) || positionName.includes(term);
  });

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-dashed bg-muted/20 space-y-2">
        <p className="text-sm text-muted-foreground">
          Configura la estructura jerárquica del colaborador para el proceso de evaluación.
          El jefe inmediato será quien realice la evaluación directa del colaborador.
        </p>
      </div>

      <div className="space-y-1.5 relative">
        <label className="text-sm font-medium">Jefe Inmediato</label>
        <div className="relative">
          <input
            type="text"
            value={showDropdown ? searchTerm : (selectedBoss ? `${selectedBoss.full_name} — ${selectedBoss.positions?.name || 'N/A'}` : "")}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => {
              setSearchTerm("");
              setShowDropdown(true);
            }}
            placeholder="Buscar por nombre, documento o cargo..."
            className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {selectedBoss && !showDropdown && (
            <button
              type="button"
              onClick={() => {
                setValue("immediate_boss_id", "");
                setSearchTerm("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              Limpiar
            </button>
          )}
          {showDropdown && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={() => setShowDropdown(false)} 
              />
              <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl z-50 max-h-56 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setValue("immediate_boss_id", "");
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground font-medium text-xs text-muted-foreground border-b border-border/40"
                >
                  -- Seleccionar jefe inmediato... (Ninguno) --
                </button>
                {filtered.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-muted-foreground text-center">
                    No se encontraron colaboradores
                  </div>
                ) : (
                  filtered.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setValue("immediate_boss_id", c.id);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2.5 hover:bg-accent hover:text-accent-foreground transition-colors border-b border-border/30 last:border-b-0 text-xs flex flex-col gap-0.5"
                    >
                      <span className="font-semibold text-foreground">{c.full_name}</span>
                      <span className="text-[10px] text-muted-foreground/85">
                        Documento: {c.document_number} · Cargo: {c.positions?.name || "N/A"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Quien realizará la evaluación directa del colaborador</p>
      </div>
    </div>
  );
}

// ---- Main Wizard ----
export default function NuevoColaboradorPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Step1Data & Step2Data & Step3Data>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [areas, setAreas] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);

  React.useEffect(() => {
    async function loadData() {
      try {
        const { getCollaborators } = await import("@/app/actions/collaborators");
        const [areasData, positionsData, collabsData] = await Promise.all([
          getAreas(),
          getPositions(),
          getCollaborators()
        ]);
        setAreas(areasData || []);
        setPositions(positionsData || []);
        setCollaborators(collabsData?.data || []);
      } catch (err) {
        console.error("Error loading config data", err);
      }
    }
    loadData();
  }, []);

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
  const form2 = useForm<Step2Data>({ 
    resolver: zodResolver(step2Schema),
    defaultValues: { status: "activo" }
  });
  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema) });

  const handleNext = async () => {
    let valid = false;
    if (currentStep === 1) {
      valid = await form1.trigger();
      if (valid) setFormData((prev) => ({ ...prev, ...form1.getValues() }));
    } else if (currentStep === 2) {
      valid = await form2.trigger();
      if (valid) setFormData((prev) => ({ ...prev, ...form2.getValues() }));
    } else if (currentStep === 3) {
      valid = await form3.trigger();
      if (valid) setFormData((prev) => ({ ...prev, ...form3.getValues() }));
    } else {
      valid = true;
    }
    if (valid && currentStep < 4) setCurrentStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { createCollaborator } = await import("@/app/actions/collaborators");
      const result = await createCollaborator(formData);
      
      if (result.error) {
        toast.error("Error al crear el colaborador: " + result.error);
        return;
      }
      
      toast.success("Colaborador creado exitosamente");
      // Opcional: redirigir a la lista
      // router.push("/colaboradores");
    } catch (err: any) {
      toast.error("Error de servidor al crear el colaborador");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <Link href="/colaboradores" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Volver a Colaboradores
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Nuevo Colaborador</h1>
        <p className="text-muted-foreground text-sm mt-1">Completa los datos del colaborador en 4 pasos</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-1.5">
                <motion.div
                  animate={{
                    background: isCompleted ? "#059669" : isCurrent ? "linear-gradient(135deg, #1e40af, #7c3aed)" : "hsl(var(--muted))",
                    scale: isCurrent ? 1.1 : 1,
                  }}
                  className={cn(
                    "wizard-step-circle text-white",
                    isCompleted && "bg-success-600 text-white",
                    !isCurrent && !isCompleted && "bg-muted text-muted-foreground"
                  )}
                  style={{
                    background: isCompleted ? "#059669" : isCurrent ? "linear-gradient(135deg, #1e40af, #7c3aed)" : undefined,
                  }}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : (
                    <step.icon className="w-4 h-4" />
                  )}
                </motion.div>
                <div className="text-center hidden sm:block">
                  <p className={cn(
                    "text-xs font-semibold",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}>{step.title}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  "wizard-step-line mx-2 mb-5",
                  currentStep > step.id ? "bg-success-500" : "bg-border"
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Form Card */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border bg-card p-6 space-y-6"
      >
        {/* Step Header */}
        <div className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
              {React.createElement(STEPS[currentStep - 1].icon, { className: "w-5 h-5 text-white" })}
            </div>
            <div>
              <h2 className="font-semibold text-lg">{STEPS[currentStep - 1].title}</h2>
              <p className="text-sm text-muted-foreground">{STEPS[currentStep - 1].description}</p>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && <StepPersonal form={form1} />}
          {currentStep === 2 && <StepLaboral form={form2} areas={areas} positions={positions} />}
          {currentStep === 3 && <StepJerarquia form={form3} collaborators={collaborators} />}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                  <p className="font-semibold text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-brand-500" />
                    Datos Personales
                  </p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nombre:</span>
                      <span className="font-medium">{formData.first_name} {formData.last_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Documento:</span>
                      <span className="font-medium">{formData.document_type} {formData.document_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Correo:</span>
                      <span className="font-medium text-xs">{formData.email || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Celular:</span>
                      <span className="font-medium">{formData.phone || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Género:</span>
                      <span className="font-medium capitalize">{formData.gender || "—"}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                  <p className="font-semibold text-sm flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-violet-500" />
                    Datos Laborales
                  </p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Área:</span>
                      <span className="font-medium">{areas.find(a => a.id === formData.area_id)?.name || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cargo:</span>
                      <span className="font-medium">{positions.find(p => p.id === formData.position_id)?.name || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estado:</span>
                      <span className="font-medium capitalize">{formData.status || "Activo"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sede / Ciudad:</span>
                      <span className="font-medium">{formData.workplace_city || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha de Ingreso:</span>
                      <span className="font-medium">{formData.hire_date || "—"}</span>
                    </div>
                    <div className="flex justify-between border-t border-border/40 pt-1.5 mt-1">
                      <span className="text-muted-foreground">Jefe Inmediato:</span>
                      <span className="font-medium text-xs truncate max-w-[120px]">
                        {collaborators.find(c => c.id === formData.immediate_boss_id)?.full_name || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-success-200 bg-success-50 dark:bg-success-950/20">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-success-700 dark:text-success-400">Listo para guardar</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <button
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </button>

          <div className="flex items-center gap-2">
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Crear Colaborador
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
