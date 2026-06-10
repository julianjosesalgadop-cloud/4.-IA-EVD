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
  
  if (!version) return { categories: [], questions: [], version: null };

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

async function getSupabaseAdmin() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
          } catch (error) {}
        },
      },
    }
  );
}

export async function updateQuestionStatus(questionId: string, isActive: boolean) {
  const supabase = await getSupabaseAdmin();
  const { error } = await supabase
    .from("evaluation_questions")
    .update({ is_active: isActive })
    .eq("id", questionId);

  if (error) return { error: error.message };
  revalidatePath("/configuracion/preguntas");
  revalidatePath("/evaluaciones/nueva");
  return { success: true };
}

export async function saveCategory(category: { id?: string; name: string; weight: number; description?: string }) {
  const supabase = await getSupabaseAdmin();
  const version = await getActiveVersion();
  if (!version) return { error: "No hay versión de evaluación activa" };

  if (category.id) {
    const { error } = await supabase
      .from("evaluation_categories")
      .update({
        name: category.name,
        weight: category.weight,
        description: category.description,
        updated_at: new Date().toISOString()
      })
      .eq("id", category.id);

    if (error) return { error: error.message };
  } else {
    const { count } = await supabase
      .from("evaluation_categories")
      .select("*", { count: "exact", head: true })
      .eq("version_id", version.id);

    const { error } = await supabase
      .from("evaluation_categories")
      .insert({
        version_id: version.id,
        name: category.name,
        weight: category.weight,
        description: category.description,
        sort_order: (count || 0) + 1,
        active: true
      });

    if (error) return { error: error.message };
  }

  revalidatePath("/configuracion/categorias");
  revalidatePath("/configuracion/preguntas");
  revalidatePath("/evaluaciones/nueva");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const supabase = await getSupabaseAdmin();
  const { error } = await supabase
    .from("evaluation_categories")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/configuracion/categorias");
  revalidatePath("/configuracion/preguntas");
  revalidatePath("/evaluaciones/nueva");
  return { success: true };
}

export async function saveQuestion(question: {
  id?: string;
  category_id: string;
  code: string;
  question: string;
  description?: string;
  is_required: boolean;
  is_active: boolean;
  is_critical: boolean;
  min_score_required: number;
  weight: number;
}) {
  const supabase = await getSupabaseAdmin();
  const version = await getActiveVersion();
  if (!version) return { error: "No hay versión de evaluación activa" };

  if (question.id) {
    const { error } = await supabase
      .from("evaluation_questions")
      .update({
        category_id: question.category_id,
        code: question.code,
        question: question.question,
        description: question.description,
        is_required: question.is_required,
        is_active: question.is_active,
        is_critical: question.is_critical,
        min_score_required: question.min_score_required,
        weight: question.weight,
        updated_at: new Date().toISOString()
      })
      .eq("id", question.id);

    if (error) return { error: error.message };
  } else {
    const { count } = await supabase
      .from("evaluation_questions")
      .select("*", { count: "exact", head: true })
      .eq("category_id", question.category_id);

    const { error } = await supabase
      .from("evaluation_questions")
      .insert({
        category_id: question.category_id,
        version_id: version.id,
        code: question.code,
        question: question.question,
        description: question.description,
        is_required: question.is_required,
        is_active: question.is_active,
        is_critical: question.is_critical,
        min_score_required: question.min_score_required,
        weight: question.weight,
        sort_order: (count || 0) + 1
      });

    if (error) return { error: error.message };
  }

  revalidatePath("/configuracion/preguntas");
  revalidatePath("/evaluaciones/nueva");
  return { success: true };
}

export async function deleteQuestion(id: string) {
  const supabase = await getSupabaseAdmin();
  const { error } = await supabase
    .from("evaluation_questions")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/configuracion/preguntas");
  revalidatePath("/evaluaciones/nueva");
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
      evaluator:profiles!evaluations_evaluator_id_fkey(first_name, last_name),
      version:evaluation_versions(name),
      result:evaluation_results(*)
    `)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, data: [] };
  return { data };
}

export async function getEvaluationById(evaluationId: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("evaluations")
    .select(`
      *,
      collaborator:collaborators(full_name, document_number, position_id, area_id),
      evaluator:profiles!evaluations_evaluator_id_fkey(first_name, last_name),
      version:evaluation_versions(name),
      result:evaluation_results(*),
      answers:evaluation_answers(
        question_id,
        category_id,
        score,
        comment,
        question:evaluation_questions(question, code, is_critical)
      )
    `)
    .eq("id", evaluationId)
    .single();

  if (error) return { error: error.message, data: null };
  return { data };
}

export async function updateEvaluation(evaluationId: string, payload: any) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("evaluations")
    .update(payload)
    .eq("id", evaluationId)
    .select()
    .single();

  if (error) return { error: error.message, data: null };
  revalidatePath("/evaluaciones");
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

  const { data: resultData, error: rpcError } = await supabase.rpc(
    "calculate_evaluation_result",
    { p_evaluation_id: evalData.id }
  );

  if (rpcError) return { error: rpcError.message };

  revalidatePath("/evaluaciones");
  revalidatePath("/dashboard");
  return { success: true, evaluation_id: evalData.id, result: resultData };
}
