"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Eye, EyeOff, Lock, Mail, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loginAction } from "@/app/actions/auth";
import { useTheme } from "next-themes";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

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
    <div className="min-h-screen flex bg-slate-50/50">
      {/* Left panel — Branding */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:flex lg:w-1/2 gradient-brand flex-col justify-between p-12 relative overflow-hidden"
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 -left-20 w-96 h-96 rounded-full bg-white/5 blur-3xl animate-pulse" />
          <div className="absolute bottom-40 right-10 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/3 blur-3xl" />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Top Header - Glass Card */}
        <div className="relative z-10 self-start">
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-inner">
              <img src="/logo.png" alt="Logo Flota Sugamuxi" className="w-full h-full object-contain p-0.5" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight tracking-wide">Flota Sugamuxi S.A.</p>
              <p className="text-brand-200 text-xs font-semibold">Desarrollo Humano</p>
            </div>
          </div>
        </div>

        {/* Hero content - Glass Card */}
        <div className="relative z-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 space-y-6 shadow-2xl shadow-brand-950/20 max-w-lg my-auto">
          <div className="space-y-2">
            <span className="px-2.5 py-1 rounded-md bg-white/20 border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest">
              Portal Corporativo EVD
            </span>
            <h1 className="text-4xl font-extrabold text-white leading-tight">
              Sistema de Evaluación <br />
              <span className="text-brand-300">de Desempeño</span>
            </h1>
          </div>

          <p className="text-white/80 text-sm leading-relaxed">
            Plataforma oficial para la valoración integral de competencias, seguimiento de objetivos estratégicos y gestión de Planes de Mejoramiento Individual (PMI).
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {[
              "Evaluaciones 90° - 360°",
              "Gestión de PMI",
              "Reportes y Firmas PDF",
              "Métricas de Desempeño",
            ].map((feat) => (
              <span
                key={feat}
                className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/90 text-xs font-medium transition-all hover:bg-white/20 hover:scale-[1.03]"
              >
                {feat}
              </span>
            ))}
          </div>
        </div>

        {/* Stats - Grid of Glass Cards */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { label: "Colaboradores", value: "240+" },
            { label: "Evaluaciones", value: "1,200+" },
            { label: "Calidad de Servicio", value: "98%" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4 text-center hover:bg-white/20 transition-all hover:-translate-y-1 cursor-default"
            >
              <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
              <p className="text-white/60 text-[9px] uppercase font-bold tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right panel — Login Form Container */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md bg-white dark:bg-card border border-slate-100 rounded-3xl p-8 md:p-10 shadow-xl shadow-slate-100 dark:shadow-none space-y-8 relative"
        >
          {/* Mobile logo header */}
          <div className="flex lg:hidden items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-3 shadow-sm mb-4">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center overflow-hidden border shadow-inner">
              <img src="/logo.png" alt="Logo Flota Sugamuxi" className="w-full h-full object-contain p-0.5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800 leading-tight">Flota Sugamuxi S.A.</p>
              <p className="text-slate-500 text-xs font-semibold">Sistema de Evaluación de Desempeño</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800">
              Iniciar sesión
            </h2>
            <p className="text-slate-500 text-sm leading-normal">
              Ingresa tus credenciales corporativas para ingresar al portal.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="usuario@flotasugamuxi.com"
                  autoComplete="email"
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-background text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Contraseña</label>
                <a href="/auth/reset-password" className="text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-12 pl-11 pr-10 rounded-xl border border-slate-200 bg-background text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
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

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full h-12 rounded-xl gradient-brand text-white font-bold text-sm shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 hover:opacity-[0.96] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Ingresar al sistema"
              )}
            </motion.button>
          </form>

          <p className="text-center text-xs text-slate-400 font-medium pt-4 border-t border-slate-100">
            © 2026 Flota Sugamuxi S.A. · EVD v1.0
          </p>
        </motion.div>
      </div>
    </div>
  );
}
