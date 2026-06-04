"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {}
      },
    }
  );
}

export async function getTrainingRecommendations() {
  const supabase = await getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: [], error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userData.user.id)
    .single();

  if (!profile?.company_id) return { data: [], error: "Empresa no encontrada" };

  const { data, error } = await supabase
    .from("training_recommendations")
    .select(`
      *,
      evaluation:evaluations(
        id, 
        collaborator:collaborators(full_name, positions(name), areas(name))
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching training:", error);
    return { data: [], error: error.message };
  }

  return { data, error: null };
}
