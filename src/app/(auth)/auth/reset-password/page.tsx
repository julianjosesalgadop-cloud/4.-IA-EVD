"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowLeft, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const resetSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${origin}/auth/callback?next=/auth/reset-password/confirm`,
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      setIsSent(true);
      toast.success("Enlace de recuperación enviado a tu correo.");
    } catch (err: any) {
      toast.error("Ocurrió un error. Intenta nuevamente.");
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
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors mb-2 uppercase tracking-wider">
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al inicio de sesión
        </Link>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 font-sans">
          Recuperar contraseña
        </h2>
        <p className="text-slate-400 text-xs font-medium leading-normal">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      {isSent ? (
        <div className="bg-success-50/50 border border-success-100 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-success-100 text-success-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800">¡Enlace enviado!</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hemos enviado un enlace de restablecimiento a tu correo. Revisa tu bandeja de entrada y spam.
          </p>
        </div>
      ) : (
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
                Enviando enlace...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar enlace de recuperación
              </>
            )}
          </motion.button>
        </form>
      )}

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
