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
        getAll() { return cookieStore.getAll(); },
        setAll() {}
      },
    }
  );
}

export async function getFeedbackSessions() {
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
    .from("feedback_sessions")
    .select(`
      *,
      evaluation:evaluations(
        id, 
        created_at,
        collaborator:collaborators(full_name, positions(name))
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching feedback:", error);
    return { data: [], error: error.message };
  }

  return { data, error: null };
}

export async function createFeedbackSession(evaluationId: string, notes: string, commitments: string) {
  const supabase = await getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("feedback_sessions")
    .insert({
      evaluation_id: evaluationId,
      scheduled_date: new Date().toISOString(),
      status: "realizada",
      notes,
      commitments,
      manager_id: userData.user.id
    });

  if (error) {
    console.error("Error creating feedback:", error);
    return { error: error.message };
  }

  revalidatePath("/retroalimentacion");
  return { success: true };
}
