"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const passwordSchema = z.object({
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ConfirmResetPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sesión no válida o expirada. Por favor, solicita de nuevo la recuperación.");
        router.push("/auth/reset-password");
      }
    };
    checkSession();
  }, [router]);

  const onSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      toast.success("Contraseña actualizada exitosamente.");
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch (err: any) {
      toast.error("Ocurrió un error al actualizar la contraseña.");
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="w-full bg-white dark:bg-card border border-slate-100/80 rounded-3xl p-8 md:p-10 shadow-2xl relative"
    >
      <div className="space-y-2 mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 font-sans">
          Nueva contraseña
        </h2>
        <p className="text-slate-400 text-xs font-medium leading-normal">
          Ingresa tu nueva contraseña para poder acceder al sistema.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nueva Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              className="w-full h-11 pl-11 pr-10 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400 font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-danger-500 text-xs flex items-center gap-1.5 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confirmar Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              {...register("confirmPassword")}
              type={showConfirm ? "text" : "password"}
              placeholder="Repite tu nueva contraseña"
              className="w-full h-11 pl-11 pr-10 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400 font-medium"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showConfirm ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-danger-500 text-xs flex items-center gap-1.5 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={isLoading}
          whileTap={{ scale: 0.98 }}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-brand-800 to-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 hover:opacity-[0.96] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Estableciendo contraseña...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Establecer contraseña
            </>
          )}
        </motion.button>
      </form>

      {/* Footer Text */}
      <div className="mt-8 pt-6 border-t border-slate-100 space-y-2">
        <p className="text-center text-slate-400 text-[10px] font-semibold leading-relaxed max-w-[280px] mx-auto">
          Sistema de uso exclusivo para personal autorizado de <span className="text-slate-500 font-bold">Flota Sugamuxi S.A.</span>
        </p>
        <p className="text-center text-[9px] text-slate-300 font-semibold">
          © 2026 Flota Sugamuxi S.A. · EVD v1.0
        </p>
      </div>
    </motion.div>
  );
}
