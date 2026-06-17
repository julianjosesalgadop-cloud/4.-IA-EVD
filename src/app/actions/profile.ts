"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const profileSchema = z.object({
  first_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  last_name: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  phone: z.string().optional().or(z.literal("")),
});

export async function updateMyProfile(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return { error: "No autenticado" };
    }

    const first_name = formData.get("first_name")?.toString();
    const last_name = formData.get("last_name")?.toString();
    const phone = formData.get("phone")?.toString();

    const result = profileSchema.safeParse({ first_name, last_name, phone });

    if (!result.success) {
      return { 
        error: "Datos inválidos", 
        fieldErrors: result.error.flatten().fieldErrors 
      };
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        first_name: result.data.first_name,
        last_name: result.data.last_name,
        phone: result.data.phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userData.user.id);

    if (updateError) {
      return { error: updateError.message };
    }

    revalidatePath("/perfil");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error al actualizar el perfil" };
  }
}

const passwordSchema = z.object({
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export async function updatePassword(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return { error: "No autenticado" };
    }

    const password = formData.get("password")?.toString();
    const confirmPassword = formData.get("confirmPassword")?.toString();

    const result = passwordSchema.safeParse({ password, confirmPassword });

    if (!result.success) {
      return { 
        error: "Datos inválidos", 
        fieldErrors: result.error.flatten().fieldErrors 
      };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: result.data.password
    });

    if (updateError) {
      return { error: updateError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error al actualizar la contraseña" };
  }
}
