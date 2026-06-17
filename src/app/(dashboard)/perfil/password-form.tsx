"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Save, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { updatePassword } from "@/app/actions/profile";
import { cn } from "@/lib/utils";

const passwordSchema = z.object({
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type PasswordData = z.infer<typeof passwordSchema>;

export function PasswordForm() {
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordData) => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("password", data.password);
      formData.append("confirmPassword", data.confirmPassword);

      const result = await updatePassword(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Contraseña actualizada exitosamente");
        reset(); // Limpia los campos del formulario
      }
    } catch (error) {
      toast.error("Ocurrió un error al actualizar la contraseña");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card border rounded-2xl p-6 shadow-sm mt-6"
    >
      <div className="mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Lock className="w-5 h-5 text-brand-500" />
          Seguridad y Contraseña
        </h3>
        <p className="text-sm text-muted-foreground">
          Actualiza la contraseña de tu cuenta para mantenerla segura.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nueva Contraseña */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Nueva Contraseña <span className="text-danger-500">*</span></label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className={cn(
                  "w-full h-11 px-3 pr-10 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all",
                  errors.password ? "border-danger-500 focus:ring-danger-500/30" : "hover:border-brand-300"
                )}
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-danger-500">{errors.password.message}</p>
            )}
          </div>

          {/* Confirmar Contraseña */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Confirmar Contraseña <span className="text-danger-500">*</span></label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                {...register("confirmPassword")}
                className={cn(
                  "w-full h-11 px-3 pr-10 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all",
                  errors.confirmPassword ? "border-danger-500 focus:ring-danger-500/30" : "hover:border-brand-300"
                )}
                placeholder="Repite tu contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-danger-500">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="h-11 px-6 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Actualizar Contraseña
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
