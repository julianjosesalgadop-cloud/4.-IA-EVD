"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Eye, EyeOff, Lock, Mail, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loginAction } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    
    // Escuchar cambios de estado para detectar recuperación de contraseña
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          toast.info("Por favor, establece tu nueva contraseña.");
          router.push("/auth/reset-password/confirm");
        }
      }
    );

    // Detectar si la sesión fue cerrada por inactividad
    if (typeof window !== "undefined" && window.location.search.includes("expired=inactivity")) {
      toast.warning("Tu sesión se ha cerrado automáticamente tras 15 minutos de inactividad.", {
        id: "inactivity-toast",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);

      const result = await loginAction(null, formData);

      if (result?.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      if (result?.success) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      toast.error("Error al iniciar sesión. Intenta nuevamente.");
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
      {/* Centered Logo */}
      <div className="w-20 h-20 rounded-2xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden shadow-md mx-auto mb-4">
        <img src="/logo.png" alt="Logo Flota Sugamuxi" className="w-[85%] h-[85%] object-contain p-0.5" />
      </div>

      {/* Title Header */}
      <div className="text-center space-y-1 mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 uppercase font-sans">
          EVD
        </h2>
        <p className="text-xs font-bold text-brand-600 tracking-wider uppercase">
          Flota Sugamuxi S.A.
        </p>
        <p className="text-slate-400 text-[11px] font-medium leading-normal max-w-[280px] mx-auto">
          Sistema de Evaluación de Desempeño
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Correo electrónico</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              {...register("email")}
              type="email"
              placeholder="usuario@flotasugamuxi.com"
              autoComplete="email"
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400 font-medium"
            />
          </div>
          {errors.email && (
            <p className="text-danger-500 text-xs flex items-center gap-1.5 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contraseña</label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
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

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isLoading}
          whileTap={{ scale: 0.98 }}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-brand-800 to-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 hover:opacity-[0.96] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Iniciando sesión...
            </>
          ) : (
            <>
              <LogIn className="w-4.5 h-4.5" />
              Iniciar Sesión
            </>
          )}
        </motion.button>
      </form>

      {/* Footer Text */}
      <div className="mt-8 pt-6 border-t border-slate-100 space-y-2">
        <p className="text-center text-slate-400 text-[10px] font-semibold leading-relaxed max-w-[280px] mx-auto">
          Sistema de uso exclusivo para personal autorizado de <span className="text-slate-500 font-bold">Flota Sugamuxi S.A.</span>
        </p>
        <p className="text-center text-[10px] text-brand-600 font-medium mt-1">
          Desarrollado por Julián Salgado | Flota Sugamuxi S.A.
        </p>
      </div>
    </motion.div>
  );
}
