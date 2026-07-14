"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
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
import { getCollaboratorFieldsConfig } from "@/app/actions/fields";
import { DEFAULT_FIELDS } from "@/lib/constants";
import { SearchableSelect } from "@/components/ui/searchable-select";

// ---- Wizard Steps ----
const STEPS = [
  { id: 1, title: "Información Personal", icon: User, description: "Datos de identificación y contacto" },
  { id: 2, title: "Información Laboral", icon: Briefcase, description: "Cargo, área y contrato" },
  { id: 3, title: "Confirmación", icon: CheckCircle2, description: "Revisión y guardado" },
];

type Step1Data = any;
type Step2Data = any;

// ---- Dynamic Schema Generators ----
function buildStep1Schema(fields: any[]) {
  const shape: any = {
    document_type: z.enum(["CC", "CE", "TI", "PP", "NIT", "RUT"]),
    document_number: z.string().min(5, "Número de documento inválido").max(20),
    first_name: z.string().min(2, "Nombre requerido").max(100),
    last_name: z.string().min(2, "Apellido requerido").max(100),
  };

  const emailField = fields.find(f => f.id === "email");
  if (emailField && emailField.is_visible) {
    shape.email = emailField.is_required
      ? z.string().email("Correo inválido")
      : z.string().email("Correo inválido").optional().or(z.literal(""));
  } else {
    shape.email = z.string().optional().or(z.literal(""));
  }

  const phoneField = fields.find(f => f.id === "phone");
  if (phoneField && phoneField.is_visible) {
    shape.phone = phoneField.is_required
      ? z.string().min(1, "Celular es requerido")
      : z.string().optional().or(z.literal(""));
  } else {
    shape.phone = z.string().optional().or(z.literal(""));
  }

  const genderField = fields.find(f => f.id === "gender");
  if (genderField && genderField.is_visible) {
    shape.gender = genderField.is_required
      ? z.enum(["masculino", "femenino", "otro", "no_informa"])
      : z.enum(["masculino", "femenino", "otro", "no_informa"]).optional().or(z.literal(""));
  } else {
    shape.gender = z.string().optional().or(z.literal(""));
  }

  return z.object(shape);
}

function buildStep2Schema(fields: any[]) {
  const shape: any = {};

  const areaField = fields.find(f => f.id === "area_id");
  if (areaField && areaField.is_visible) {
    shape.area_id = areaField.is_required
      ? z.string().min(1, "Selecciona un área")
      : z.string().optional().or(z.literal(""));
  } else {
    shape.area_id = z.string().optional().or(z.literal(""));
  }

  const positionField = fields.find(f => f.id === "position_id");
  if (positionField && positionField.is_visible) {
    shape.position_id = positionField.is_required
      ? z.string().min(1, "Selecciona un cargo")
      : z.string().optional().or(z.literal(""));
  } else {
    shape.position_id = z.string().optional().or(z.literal(""));
  }

  const statusField = fields.find(f => f.id === "status");
  if (statusField && statusField.is_visible) {
    shape.status = statusField.is_required
      ? z.enum(["activo", "inactivo", "retirado", "vacaciones", "incapacidad"])
      : z.enum(["activo", "inactivo", "retirado", "vacaciones", "incapacidad"]).optional().or(z.literal(""));
  } else {
    shape.status = z.enum(["activo", "inactivo", "retirado", "vacaciones", "incapacidad"]).optional().or(z.literal(""));
  }

  const cityField = fields.find(f => f.id === "workplace_city");
  if (cityField && cityField.is_visible) {
    shape.workplace_city = cityField.is_required
      ? z.string().min(1, "Sede/Ciudad es requerida")
      : z.string().optional().or(z.literal(""));
  } else {
    shape.workplace_city = z.string().optional().or(z.literal(""));
  }

  const hireDateField = fields.find(f => f.id === "hire_date");
  if (hireDateField && hireDateField.is_visible) {
    shape.hire_date = hireDateField.is_required
      ? z.string().min(1, "Fecha de ingreso es requerida")
      : z.string().optional().or(z.literal(""));
  } else {
    shape.hire_date = z.string().optional().or(z.literal(""));
  }

  return z.object(shape);
}



// ---- Step Components ----
function StepPersonal({ form, fieldsConfig }: { form: ReturnType<typeof useForm<Step1Data>>; fieldsConfig: any[] }) {
  const { register, formState: { errors } } = form;

  const isVisible = (id: string) => fieldsConfig.find(f => f.id === id)?.is_visible !== false;
  const isRequired = (id: string) => fieldsConfig.find(f => f.id === id)?.is_required === true;
  const getLabel = (id: string, fallback: string) => fieldsConfig.find(f => f.id === id)?.label || fallback;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isVisible("document_type") && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {getLabel("document_type", "Tipo de Documento")} {isRequired("document_type") ? "*" : ""}
            </label>
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
        )}
        {isVisible("document_number") && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {getLabel("document_number", "Número de Documento")} {isRequired("document_number") ? "*" : ""}
            </label>
            <input
              {...register("document_number")}
              placeholder="Ej: 19234567"
              className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {errors.document_number?.message && <p className="text-danger-500 text-xs">{errors.document_number.message.toString()}</p>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isVisible("first_name") && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {getLabel("first_name", "Nombres")} {isRequired("first_name") ? "*" : ""}
            </label>
            <input
              {...register("first_name")}
              placeholder="Ej: Carlos Alberto"
              className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {errors.first_name?.message && <p className="text-danger-500 text-xs">{errors.first_name.message.toString()}</p>}
          </div>
        )}
        {isVisible("last_name") && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {getLabel("last_name", "Apellidos")} {isRequired("last_name") ? "*" : ""}
            </label>
            <input
              {...register("last_name")}
              placeholder="Ej: Martínez Rojas"
              className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {errors.last_name?.message && <p className="text-danger-500 text-xs">{errors.last_name.message.toString()}</p>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isVisible("email") && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {getLabel("email", "Correo Electrónico")} {isRequired("email") ? "*" : ""}
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="correo@empresa.com"
              className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {errors.email?.message && <p className="text-danger-500 text-xs">{errors.email.message.toString()}</p>}
          </div>
        )}
        {isVisible("phone") && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {getLabel("phone", "Celular")} {isRequired("phone") ? "*" : ""}
            </label>
            <input
              {...register("phone")}
              placeholder="3001234567"
              className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {errors.phone?.message && <p className="text-danger-500 text-xs">{errors.phone.message.toString()}</p>}
          </div>
        )}
      </div>

      {isVisible("gender") && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            {getLabel("gender", "Género")} {isRequired("gender") ? "*" : ""}
          </label>
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
          {errors.gender?.message && <p className="text-danger-500 text-xs">{errors.gender.message.toString()}</p>}
        </div>
      )}
    </div>
  );
}

function StepLaboral({
  form,
  areas,
  positions,
  fieldsConfig,
}: {
  form: ReturnType<typeof useForm<Step2Data>>;
  areas: any[];
  positions: any[];
  fieldsConfig: any[];
}) {
  const { register, control, formState: { errors } } = form;

  const isVisible = (id: string) => fieldsConfig.find(f => f.id === id)?.is_visible !== false;
  const isRequired = (id: string) => fieldsConfig.find(f => f.id === id)?.is_required === true;
  const getLabel = (id: string, fallback: string) => fieldsConfig.find(f => f.id === id)?.label || fallback;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isVisible("area_id") && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {getLabel("area_id", "Área")} {isRequired("area_id") ? "*" : ""}
            </label>
            <select
              {...register("area_id")}
              className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Seleccionar área...</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
            {errors.area_id?.message && <p className="text-danger-500 text-xs">{errors.area_id.message.toString()}</p>}
          </div>
        )}
        {isVisible("position_id") && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {getLabel("position_id", "Cargo")} {isRequired("position_id") ? "*" : ""}
            </label>
            <Controller
              control={control}
              name="position_id"
              render={({ field }) => (
                <SearchableSelect
                  options={positions.map((pos) => ({
                    value: pos.id,
                    label: pos.name
                  }))}
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Seleccionar cargo..."
                />
              )}
            />
            {errors.position_id?.message && <p className="text-danger-500 text-xs">{errors.position_id.message.toString()}</p>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isVisible("workplace_city") && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {getLabel("workplace_city", "Sede / Ciudad")} {isRequired("workplace_city") ? "*" : ""}
            </label>
            <input
              {...register("workplace_city")}
              placeholder="Ej: Sogamoso"
              className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {errors.workplace_city?.message && <p className="text-danger-500 text-xs">{errors.workplace_city.message.toString()}</p>}
          </div>
        )}
        {isVisible("hire_date") && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {getLabel("hire_date", "Fecha de Ingreso")} {isRequired("hire_date") ? "*" : ""}
            </label>
            <input
              {...register("hire_date")}
              type="date"
              className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {errors.hire_date?.message && <p className="text-danger-500 text-xs">{errors.hire_date.message.toString()}</p>}
          </div>
        )}
      </div>

      {isVisible("status") && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            {getLabel("status", "Estado")} {isRequired("status") ? "*" : ""}
          </label>
          <select
            {...register("status")}
            className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="vacaciones">Vacaciones</option>
            <option value="incapacidad">Incapacidad</option>
          </select>
          {errors.status?.message && <p className="text-danger-500 text-xs">{errors.status.message.toString()}</p>}
        </div>
      )}
    </div>
  );
}



// ---- Main Wizard ----
export default function NuevoColaboradorPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [areas, setAreas] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [fieldsConfig, setFieldsConfig] = useState<any[]>(DEFAULT_FIELDS);

  useEffect(() => {
    async function loadData() {
      try {
        const { getCollaborators } = await import("@/app/actions/collaborators");
        const [areasData, positionsData, collabsData, fieldsData] = await Promise.all([
          getAreas(),
          getPositions(),
          getCollaborators(),
          getCollaboratorFieldsConfig(),
        ]);
        setAreas(areasData || []);
        setPositions(positionsData || []);
        setCollaborators(collabsData?.data || []);
        if (fieldsData?.data) {
          setFieldsConfig(fieldsData.data);
        }
      } catch (err) {
        console.error("Error loading config data", err);
      }
    }
    loadData();
  }, []);

  const form1 = useForm<Step1Data>({
    resolver: (values, context, options) => {
      const dynamicSchema = buildStep1Schema(fieldsConfig);
      return zodResolver(dynamicSchema)(values, context, options);
    },
  });

  const form2 = useForm<Step2Data>({
    resolver: (values, context, options) => {
      const dynamicSchema = buildStep2Schema(fieldsConfig);
      return zodResolver(dynamicSchema)(values, context, options);
    },
    defaultValues: { status: "activo" },
  });

  const handleNext = async () => {
    let valid = false;
    if (currentStep === 1) {
      valid = await form1.trigger();
      if (valid) setFormData((prev) => ({ ...prev, ...form1.getValues() }));
    } else if (currentStep === 2) {
      valid = await form2.trigger();
      if (valid) setFormData((prev) => ({ ...prev, ...form2.getValues() }));
    } else {
      valid = true;
    }
    if (valid && currentStep < 3) setCurrentStep((s) => s + 1);
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
    } catch (err: any) {
      toast.error("Error de servidor al crear el colaborador");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVisible = (id: string) => fieldsConfig.find(f => f.id === id)?.is_visible !== false;
  const getLabel = (id: string, fallback: string) => fieldsConfig.find(f => f.id === id)?.label || fallback;

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
        <p className="text-muted-foreground text-sm mt-1">Completa los datos del colaborador en 3 pasos</p>
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
            <div className="w-10 h-10 gradient-brand flex items-center justify-center">
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
          {currentStep === 1 && <StepPersonal form={form1} fieldsConfig={fieldsConfig} />}
          {currentStep === 2 && <StepLaboral form={form2} areas={areas} positions={positions} fieldsConfig={fieldsConfig} />}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                  <p className="font-semibold text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-brand-500" />
                    Datos Personales
                  </p>
                  <div className="space-y-1.5 text-sm">
                    {isVisible("first_name") && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{getLabel("first_name", "Nombres")}:</span>
                        <span className="font-medium">{formData.first_name} {formData.last_name}</span>
                      </div>
                    )}
                    {isVisible("document_number") && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{getLabel("document_number", "Documento")}:</span>
                        <span className="font-medium">{formData.document_type} {formData.document_number}</span>
                      </div>
                    )}
                    {isVisible("email") && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{getLabel("email", "Correo")}:</span>
                        <span className="font-medium text-xs">{formData.email || "—"}</span>
                      </div>
                    )}
                    {isVisible("phone") && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{getLabel("phone", "Celular")}:</span>
                        <span className="font-medium">{formData.phone || "—"}</span>
                      </div>
                    )}
                    {isVisible("gender") && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{getLabel("gender", "Género")}:</span>
                        <span className="font-medium capitalize">{formData.gender || "—"}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                  <p className="font-semibold text-sm flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-violet-500" />
                    Datos Laborales
                  </p>
                  <div className="space-y-1.5 text-sm">
                    {isVisible("area_id") && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{getLabel("area_id", "Área")}:</span>
                        <span className="font-medium">{areas.find(a => a.id === formData.area_id)?.name || "—"}</span>
                      </div>
                    )}
                    {isVisible("position_id") && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{getLabel("position_id", "Cargo")}:</span>
                        <span className="font-medium">{positions.find(p => p.id === formData.position_id)?.name || "—"}</span>
                      </div>
                    )}
                    {isVisible("status") && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{getLabel("status", "Estado")}:</span>
                        <span className="font-medium capitalize">{formData.status || "Activo"}</span>
                      </div>
                    )}
                    {isVisible("workplace_city") && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{getLabel("workplace_city", "Sede / Ciudad")}:</span>
                        <span className="font-medium">{formData.workplace_city || "—"}</span>
                      </div>
                    )}
                    {isVisible("hire_date") && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{getLabel("hire_date", "Fecha de Ingreso")}:</span>
                        <span className="font-medium">{formData.hire_date || "—"}</span>
                      </div>
                    )}
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
            {currentStep < 3 ? (
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
