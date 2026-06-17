"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { Resend } from "resend";
import { logAudit } from "./audit";

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
  noStore();
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
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
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

export async function saveCategory(category: { 
  id?: string; 
  name: string; 
  weight: number; 
  description?: string;
  is_critical?: boolean;
  min_score_required?: number;
}) {
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
        is_critical: category.is_critical ?? false,
        min_score_required: category.min_score_required ?? 4.00,
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
        is_critical: category.is_critical ?? false,
        min_score_required: category.min_score_required ?? 4.00,
        sort_order: (count || 0) + 1,
        active: true
      });

    if (error) return { error: error.message };
  }

  revalidatePath("/configuracion/categorias");
  revalidatePath("/configuracion/preguntas");
  revalidatePath("/evaluaciones/nueva");
  return { success: true, data: category };
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
      collaborator:collaborators(
        full_name, 
        document_number, 
        position_id,
        position:positions(name),
        areas:areas(name)
      ),
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
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "No autenticado", data: null };

  const adminClient = await getSupabaseAdmin();
  const { data, error } = await adminClient
    .from("evaluations")
    .select(`
      *,
      collaborator:collaborators(
        id,
        full_name,
        document_type,
        document_number,
        position_id,
        area_id,
        email,
        workplace_city,
        workplace,
        contract_type,
        hire_date,
        status,
        position:positions(name),
        areas:areas(name)
      ),
      evaluator:profiles!evaluations_evaluator_id_fkey(first_name, last_name, email, avatar_url, role:roles(display_name)),
      version:evaluation_versions(name),
      result:evaluation_results(*),
      answers:evaluation_answers(
        question_id,
        category_id,
        score,
        comment,
        question:evaluation_questions(question, code, is_critical),
        category:evaluation_categories(name)
      )
    `)
    .eq("id", evaluationId)
    .single();

  if (error) return { error: error.message, data: null };

  // Fetch evaluator cargo (position name) if their email is registered as a collaborator
  if (data && data.evaluator?.email) {
    const { data: evaluatorCollab } = await adminClient
      .from("collaborators")
      .select("position:positions(name)")
      .eq("email", data.evaluator.email)
      .maybeSingle();

    const positionData = evaluatorCollab?.position;
    const cargoName = Array.isArray(positionData) 
      ? positionData[0]?.name 
      : (positionData as any)?.name;

    if (cargoName) {
      data.evaluator.cargo = cargoName;
    }
  }

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
      evaluation_year: payload.evaluation_year || new Date().getFullYear(),
      evaluation_type: '90',
      status: 'finalizada',
      observations: payload.observations,
      strengths: payload.strengths,
      improvement_opportunities: payload.improvement_opportunities,
      training_needs: payload.training_needs,
      finalized_at: new Date().toISOString(),
      finalized_by: userData.user.id,
      draft_data: payload.signature ? { collaborator_signature: payload.signature } : null,
      evaluatee_signed_at: payload.signature ? new Date().toISOString() : null,
      evaluator_signed_at: new Date().toISOString(),
      evaluatee_accepted: payload.signature ? true : false,
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

  // Registrar en auditoría
  try {
    await logAudit(
      "finalizar",
      "evaluations",
      evalData.id,
      `Evaluación finalizada para colaborador ID: ${payload.evaluatee_id}. Resultado calculado.`
    );
  } catch (_) { /* no bloquear si falla la auditoría */ }

  return { success: true, evaluation_id: evalData.id, result: resultData };
}

export async function sendEvaluationEmail({
  evaluationId,
  pdfBase64,
  fileName,
  recipientEmail,
  recipientName,
  evaluationYear,
  score,
  result
}: {
  evaluationId: string;
  pdfBase64: string;
  fileName: string;
  recipientEmail: string;
  recipientName: string;
  evaluationYear: number;
  score: number;
  result: string;
}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { error: "RESEND_API_KEY no configurado en el servidor." };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Determinar remitente: usar dominio verificado si existe, sino el de prueba de Resend
    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@flotasugamuxisa.com.co";
    const fromName = process.env.RESEND_FROM_NAME || "Evaluaciones Flota Sugamuxi";

    const resultColor =
      result.toLowerCase() === "aprobado" ? "#10b981" :
      result.toLowerCase() === "plan_mejoramiento" ? "#f59e0b" : "#ef4444";

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; color: #1e293b;">
        <h2 style="color: #012169; border-bottom: 2px solid #0084D5; padding-bottom: 10px; margin-bottom: 20px;">FLOTA SUGAMUXI S.A.</h2>
        <p>Estimado(a) <strong>${recipientName}</strong>,</p>
        <p>Se ha finalizado y registrado con éxito su <strong>Evaluación de Desempeño (EVD)</strong> correspondiente al año <strong>${evaluationYear}</strong>.</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0084D5;">Resumen de Resultados</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; width: 40%;">Calificación Promedio:</td>
              <td style="padding: 6px 0;">${score.toFixed(2)} / 5.00</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Resultado General:</td>
              <td style="padding: 6px 0; font-weight: bold; color: ${resultColor};">${result.replace(/_/g, " ").toUpperCase()}</td>
            </tr>
          </table>
        </div>
        <p>Adjunto encontrará el reporte en formato PDF con el desglose detallado de competencias, calificaciones y observaciones del proceso.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
          Correo automático del Sistema de Gestión de Desempeño — Flota Sugamuxi S.A.
        </p>
      </div>
    `;

    // Convertir base64 a Buffer para el adjunto (requerido por Resend v6+)
    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    const response = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: recipientEmail,
      subject: `Reporte EVD ${evaluationYear} - ${recipientName}`,
      html: emailHtml,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
        },
      ],
    });

    if (response.error) {
      console.error("Resend error detail:", response.error);
      const errMsg = (response.error as any)?.message || JSON.stringify(response.error);
      // Error de dominio no verificado — instrucción clara
      if (errMsg.includes("not allowed") || errMsg.includes("verify") || errMsg.includes("domain") || errMsg.includes("authorized")) {
        return {
          error: `Dominio no verificado: con el plan gratuito de Resend solo puedes enviar al correo del propietario de la cuenta. Para enviar a cualquier destinatario, verifica tu dominio en resend.com/domains y agrega RESEND_FROM_EMAIL=noreply@tudominio.com al archivo .env.local`
        };
      }
      return { error: `Error al enviar: ${errMsg}` };
    }

    // Registrar en auditoría
    try {
      await logAudit(
        "correo_enviado",
        "evaluations",
        evaluationId,
        `Reporte de evaluación enviado a ${recipientName} (${recipientEmail})`
      );
    } catch (_) { /* no bloquear si falla la auditoría */ }

    return { success: true };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return { error: error?.message || "Error inesperado al enviar el correo." };
  }
}

// ==========================================
// VERSIONES DE EVALUACIÓN
// ==========================================

export async function getEvaluationVersions() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("evaluation_versions")
    .select(`
      *,
      questions:evaluation_questions(count)
    `)
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, data: [] };

  const formatted = (data || []).map((v: any) => ({
    ...v,
    questions_count: v.questions?.[0]?.count || 0
  }));

  return { data: formatted };
}

export async function saveEvaluationVersion(version: {
  id?: string;
  year: number;
  name: string;
  description?: string;
  is_active?: boolean;
  is_published?: boolean;
  approved_threshold?: number;
  pmi_threshold?: number;
}) {
  const supabase = await getSupabaseAdmin();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userData.user.id)
    .single();

  if (!profile?.company_id) return { error: "Compañía no encontrada" };

  if (version.is_active) {
    await supabase
      .from("evaluation_versions")
      .update({ is_active: false })
      .eq("company_id", profile.company_id);
  }

  if (version.id) {
    const { error } = await supabase
      .from("evaluation_versions")
      .update({
        year: version.year,
        name: version.name,
        description: version.description,
        is_active: version.is_active ?? false,
        is_published: version.is_published ?? false,
        approved_threshold: version.approved_threshold ?? 4.0,
        pmi_threshold: version.pmi_threshold ?? 3.1,
        updated_at: new Date().toISOString()
      })
      .eq("id", version.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("evaluation_versions")
      .insert({
        company_id: profile.company_id,
        year: version.year,
        name: version.name,
        description: version.description,
        is_active: version.is_active ?? false,
        is_published: version.is_published ?? false,
        approved_threshold: version.approved_threshold ?? 4.0,
        pmi_threshold: version.pmi_threshold ?? 3.1,
        created_by: userData.user.id
      });

    if (error) return { error: error.message };
  }

  revalidatePath("/configuracion/versiones");
  return { success: true };
}

export async function cloneEvaluationVersion(versionId: string) {
  const supabase = await getSupabaseAdmin();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "No autenticado" };

  const { data: original, error: origError } = await supabase
    .from("evaluation_versions")
    .select("*")
    .eq("id", versionId)
    .single();

  if (origError || !original) return { error: "Versión original no encontrada: " + origError?.message };

  const newName = `${original.name} (Copia)`;
  const { data: newVersion, error: createError } = await supabase
    .from("evaluation_versions")
    .insert({
      company_id: original.company_id,
      year: original.year,
      name: newName,
      description: original.description,
      is_active: false,
      is_published: false,
      approved_threshold: original.approved_threshold,
      pmi_threshold: original.pmi_threshold,
      created_by: userData.user.id
    })
    .select()
    .single();

  if (createError || !newVersion) return { error: "Error al crear la versión clonada: " + createError?.message };

  const { data: categories } = await supabase
    .from("evaluation_categories")
    .select("*")
    .eq("version_id", original.id);

  if (categories && categories.length > 0) {
    for (const cat of categories) {
      const { data: newCat, error: catError } = await supabase
        .from("evaluation_categories")
        .insert({
          version_id: newVersion.id,
          name: cat.name,
          description: cat.description,
          sort_order: cat.sort_order,
          weight: cat.weight,
          active: cat.active
        })
        .select()
        .single();

      if (catError || !newCat) continue;

      const { data: questions } = await supabase
        .from("evaluation_questions")
        .select("*")
        .eq("category_id", cat.id)
        .eq("version_id", original.id);

      if (questions && questions.length > 0) {
        const questionsToInsert = questions.map((q) => ({
          category_id: newCat.id,
          version_id: newVersion.id,
          code: q.code,
          question: q.question,
          description: q.description,
          sort_order: q.sort_order,
          is_required: q.is_required,
          is_active: q.is_active,
          is_critical: q.is_critical,
          min_score_required: q.min_score_required,
          weight: q.weight
        }));

        await supabase
          .from("evaluation_questions")
          .insert(questionsToInsert);
      }
    }
  }

  revalidatePath("/configuracion/versiones");
  return { success: true };
}
