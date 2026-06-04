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
// CONFIGURACIÓN (VERSIONES, CATEGORÍAS, PREGUNTAS)
// ==========================================

export async function getActiveVersion() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("evaluation_versions")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching active version:", error);
    return null;
  }
  return data;
}

export async function getEvaluationConfig() {
  const supabase = await getSupabase();
  const version = await getActiveVersion();
  
  if (!version) return { categories: [], questions: [] };

  const [categoriesRes, questionsRes] = await Promise.all([
    supabase
      .from("evaluation_categories")
      .select("*")
      .eq("version_id", version.id)
      .order("sort_order"),
    supabase
      .from("evaluation_questions")
      .select("*")
      .eq("version_id", version.id)
      .order("sort_order"),
  ]);

  return {
    categories: categoriesRes.data || [],
    questions: questionsRes.data || [],
    version,
  };
}

export async function updateQuestionStatus(questionId: string, isActive: boolean) {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("evaluation_questions")
    .update({ is_active: isActive })
    .eq("id", questionId);

  if (error) return { error: error.message };
  revalidatePath("/configuracion/preguntas");
  return { success: true };
}

// ==========================================
// EVALUACIONES Y RESULTADOS
// ==========================================

export async function getEvaluations() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("evaluations")
    .select(`
      *,
      collaborator:collaborators(full_name, document_number, position_id),
      evaluator:profiles(first_name, last_name),
      version:evaluation_versions(name),
      result:evaluation_results(*)
    `)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, data: [] };
  return { data };
}

export async function saveEvaluation(payload: any) {
  const supabase = await getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("No autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userData.user.id)
    .single();

  if (!profile?.company_id) throw new Error("Compañía no encontrada");

  // 1. Insert header
  const { data: evalData, error: evalError } = await supabase
    .from("evaluations")
    .insert({
      company_id: profile.company_id,
      version_id: payload.version_id,
      evaluatee_id: payload.evaluatee_id,
      evaluator_id: userData.user.id,
      evaluation_year: new Date().getFullYear(),
      evaluation_type: '90',
      status: 'finalizada',
      observations: payload.observations,
      strengths: payload.strengths,
      improvement_opportunities: payload.improvement_opportunities,
      training_needs: payload.training_needs,
      finalized_at: new Date().toISOString(),
      finalized_by: userData.user.id,
    })
    .select()
    .single();

  if (evalError) return { error: evalError.message };

  // 2. Insert answers
  const answers = payload.answers.map((ans: any) => ({
    evaluation_id: evalData.id,
    question_id: ans.question_id,
    category_id: ans.category_id,
    score: ans.score,
    comment: ans.comment,
  }));

  const { error: answersError } = await supabase
    .from("evaluation_answers")
    .insert(answers);

  if (answersError) return { error: answersError.message };

  // 3. Trigger calculation function via RPC
  const { data: resultData, error: rpcError } = await supabase.rpc(
    "calculate_evaluation_result",
    { p_evaluation_id: evalData.id }
  );

  if (rpcError) return { error: rpcError.message };

  revalidatePath("/evaluaciones");
  revalidatePath("/dashboard");
  return { success: true, evaluation_id: evalData.id, result: resultData };
}
