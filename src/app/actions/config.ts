"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Ignore
          }
        },
      },
    }
  );
}

// ==========================================
// ÁREAS
// ==========================================
export async function getAreas() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("areas")
    .select("*")
    .order("name");
  
  if (error) throw error;
  return data;
}

export async function createArea(areaData: any) {
  const supabase = await getSupabase();
  
  // Obtener la empresa del usuario actual
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("No autenticado");
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userData.user.id)
    .single();

  const { error } = await supabase.from("areas").insert({
    ...areaData,
    company_id: profile?.company_id,
  });

  if (error) return { error: error.message };
  revalidatePath("/configuracion");
  return { success: true };
}

// ==========================================
// CARGOS (POSITIONS)
// ==========================================
export async function getPositions() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("positions")
    .select(`
      *,
      areas(name)
    `)
    .order("name");
  
  if (error) throw error;
  return data;
}

export async function createPosition(positionData: any) {
  const supabase = await getSupabase();
  
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("No autenticado");
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userData.user.id)
    .single();

  const { error } = await supabase.from("positions").insert({
    ...positionData,
    company_id: profile?.company_id,
  });

  if (error) return { error: error.message };
  revalidatePath("/configuracion");
  return { success: true };
}
