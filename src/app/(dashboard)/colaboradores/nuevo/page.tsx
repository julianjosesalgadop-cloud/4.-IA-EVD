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
  address: z.string().optional(),
  city: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(["masculino", "femenino", "otro", "no_informa"]).optional(),
});

const step2Schema = z.object({
  internal_code: z.string().optional(),
  area_id: z.string().min(1, "Selecciona un área"),
  position_id: z.string().min(1, "Selecciona un cargo"),
  process_id: z.string().optional(),
  cost_center_id: z.string().optional(),
  workplace_city: z.string().optional(),
  workplace: z.string().optional(),
  contract_type: z.enum(["indefinido", "fijo", "obra_labor", "aprendizaje", "prestacion_servicios", "temporal"]).optional(),
  hire_date: z.string().min(1, "Fecha de ingreso requerida"),
  status: z.enum(["activo", "inactivo", "retirado", "vacaciones", "incapacidad"]).default("activo"),
});

const step3Schema = z.object({
  immediate_boss_id: z.string().optional(),
  area_leader_id: z.string().optional(),
  responsible_manager_id: z.string().optional(),
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

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-1.5">
          <label className="text-sm font-medium">Dirección</label>
          <input
            {...register("address")}
            placeholder="Calle 15 # 8-32"
            className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Ciudad</label>
          <input
            {...register("city")}
            placeholder="Sogamoso"
            className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Fecha de Nacimiento</label>
          <input
            {...register("birth_date")}
            type="date"
            className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
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
          <label className="text-sm font-medium">Código Interno</label>
          <input
            {...register("internal_code")}
            placeholder="Ej: EMP-001"
            className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Tipo de Contrato</label>
          <select
            {...register("contract_type")}
            className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Seleccionar...</option>
            <option value="indefinido">Término Indefinido</option>
            <option value="fijo">Término Fijo</option>
            <option value="obra_labor">Obra o Labor</option>
            <option value="aprendizaje">Aprendizaje</option>
            <option value="prestacion_servicios">Prestación de Servicios</option>
            <option value="temporal">Temporal</option>
          </select>
        </div>
      </div>

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
          <label className="text-sm font-medium">Ciudad de Trabajo</label>
          <input
            {...register("workplace_city")}
            placeholder="Sogamoso"
            className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Sede</label>
          <input
            {...register("workplace")}
            placeholder="Terminal Principal"
            className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Fecha de Ingreso *</label>
          <input
            {...register("hire_date")}
            type="date"
            className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {errors.hire_date && <p className="text-danger-500 text-xs">{errors.hire_date.message}</p>}
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
    </div>
  );
}

function StepJerarquia({ form }: { form: ReturnType<typeof useForm<Step3Data>> }) {
  const { register } = form;

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-dashed bg-muted/20 space-y-2">
        <p className="text-sm text-muted-foreground">
          Configura la estructura jerárquica del colaborador para el proceso de evaluación.
          Los evaluadores podrán ser el jefe inmediato o el líder de área.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Jefe Inmediato</label>
        <select
          {...register("immediate_boss_id")}
          className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Seleccionar jefe inmediato...</option>
          <option value="3">Carlos Martínez — Jefe de Operaciones</option>
          <option value="5">Jorge Castro — Jefe de Mantenimiento</option>
          <option value="7">Rosa Suárez — Coordinadora G. Humana</option>
        </select>
        <p className="text-xs text-muted-foreground">Quien realizará la evaluación directa del colaborador</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Líder de Área</label>
        <select
          {...register("area_leader_id")}
          className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Seleccionar líder de área...</option>
          <option value="3">Carlos Martínez — Operaciones</option>
          <option value="5">Jorge Castro — Mantenimiento</option>
          <option value="7">Rosa Suárez — Gestión Humana</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Gerente Responsable</label>
        <select
          {...register("responsible_manager_id")}
          className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Seleccionar gerente...</option>
          <option value="gerente1">Gerente General — Flota Sugamuxi</option>
          <option value="subgerente1">Subgerente Operativo</option>
        </select>
        <p className="text-xs text-muted-foreground">Recibirá notificaciones de evaluaciones y PMI de este colaborador</p>
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

  React.useEffect(() => {
    async function loadData() {
      try {
        const [areasData, positionsData] = await Promise.all([
          getAreas(),
          getPositions()
        ]);
        setAreas(areasData || []);
        setPositions(positionsData || []);
      } catch (err) {
        console.error("Error loading config data", err);
      }
    }
    loadData();
  }, []);

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });
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
          {currentStep === 3 && <StepJerarquia form={form3} />}
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
                  </div>
                </div>
                <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                  <p className="font-semibold text-sm flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-violet-500" />
                    Datos Laborales
                  </p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estado:</span>
                      <span className="font-medium capitalize">{formData.status || "Activo"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ingreso:</span>
                      <span className="font-medium">{formData.hire_date || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-success-200 bg-success-50 dark:bg-success-950/20">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-success-700 dark:text-success-400">Listo para guardar</p>
                    <p className="text-sm text-success-600/80 dark:text-success-500/80 mt-1">
                      Se creará el colaborador y se enviará un correo de bienvenida al correo registrado.
                    </p>
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
