"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Save, User, Mail, Phone, Building2, Shield, Loader2 } from "lucide-react";
import { updateMyProfile } from "@/app/actions/profile";
import { cn } from "@/lib/utils";
import { SignatureInput } from "@/components/ui/signature-input";

const ROLE_MAP: Record<string, { name: string; display_name: string }> = {
  "22222222-0000-0000-0000-000000000001": { name: "admin", display_name: "Administrador" },
  "22222222-0000-0000-0000-000000000002": { name: "rrhh", display_name: "Gestión Humana" },
  "22222222-0000-0000-0000-000000000003": { name: "gerencia", display_name: "Gerencia" },
  "22222222-0000-0000-0000-000000000004": { name: "lider", display_name: "Líder / Jefe" },
  "22222222-0000-0000-0000-000000000005": { name: "colaborador", display_name: "Colaborador" }
};

const profileSchema = z.object({
  first_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  last_name: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  phone: z.string().optional().or(z.literal("")),
});

type ProfileData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialData: any;
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatar_url || "");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: initialData.first_name || "",
      last_name: initialData.last_name || "",
      phone: initialData.phone || "",
    },
  });

  const resolvedRole = initialData.roles || (initialData.role_id ? ROLE_MAP[initialData.role_id] : null);
  const roleDisplayName = resolvedRole?.display_name || "Usuario";
  const roleName = resolvedRole?.name || "Sin rol";

  const onSubmit = async (data: ProfileData) => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("first_name", data.first_name);
      formData.append("last_name", data.last_name);
      if (data.phone) {
        formData.append("phone", data.phone);
      }
      formData.append("avatar_url", avatarUrl);

      const result = await updateMyProfile(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Perfil actualizado exitosamente");
      }
    } catch (error) {
      toast.error("Ocurrió un error al actualizar el perfil");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Información de solo lectura */}
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border rounded-2xl p-6 shadow-sm"
        >
          <div className="flex flex-col items-center text-center space-y-4 mb-6">
            <div className="w-24 h-24 rounded-full bg-brand-50 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
              <span className="text-3xl font-bold text-brand-600 uppercase">
                {initialData.first_name.charAt(0)}{initialData.last_name.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {initialData.first_name} {initialData.last_name}
              </h2>
              <p className="text-sm text-muted-foreground">{roleDisplayName}</p>
            </div>
            <div className="px-3 py-1 bg-success-50 text-success-700 rounded-full text-xs font-semibold border border-success-200">
              Cuenta Activa
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span className="truncate">{initialData.email}</span>
            </div>
            {initialData.companies?.name && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span className="truncate">{initialData.companies.name}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span className="truncate capitalize">{roleDisplayName}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Formulario editable */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="lg:col-span-2 bg-card border rounded-2xl p-6 shadow-sm"
      >
        <div className="mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-brand-500" />
            Datos Personales
          </h3>
          <p className="text-sm text-muted-foreground">
            Actualiza tu información de contacto. El correo y rol solo pueden ser modificados por un administrador.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Nombres <span className="text-danger-500">*</span></label>
              <input
                {...register("first_name")}
                className={cn(
                  "w-full h-11 px-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all",
                  errors.first_name ? "border-danger-500 focus:ring-danger-500/30" : "hover:border-brand-300"
                )}
                placeholder="Tus nombres"
              />
              {errors.first_name && (
                <p className="text-xs text-danger-500">{errors.first_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Apellidos <span className="text-danger-500">*</span></label>
              <input
                {...register("last_name")}
                className={cn(
                  "w-full h-11 px-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all",
                  errors.last_name ? "border-danger-500 focus:ring-danger-500/30" : "hover:border-brand-300"
                )}
                placeholder="Tus apellidos"
              />
              {errors.last_name && (
                <p className="text-xs text-danger-500">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Celular / Teléfono</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  {...register("phone")}
                  className={cn(
                    "w-full h-11 pl-10 pr-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all",
                    errors.phone ? "border-danger-500 focus:ring-danger-500/30" : "hover:border-brand-300"
                  )}
                  placeholder="300 000 0000"
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-danger-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Correo Electrónico (No editable)</label>
              <input
                type="email"
                value={initialData.email}
                disabled
                className="w-full h-11 px-3 rounded-xl border bg-muted/50 text-muted-foreground text-sm cursor-not-allowed"
              />
            </div>
          </div>

          {roleName !== "colaborador" && (
            <div className="space-y-2 pt-4 border-t">
              <label className="text-sm font-semibold text-foreground">Firma del Evaluador</label>
              <SignatureInput
                value={avatarUrl || null}
                onChange={(val) => setAvatarUrl(val || "")}
                placeholder="Firme con su mouse/pantalla táctil o cargue una imagen"
              />
            </div>
          )}

          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="h-11 px-6 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
