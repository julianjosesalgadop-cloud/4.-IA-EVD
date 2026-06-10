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

export async function getDashboardStats() {
  const supabase = await getSupabase();
  
  // 1. Total Collaborators
  const { count: totalCollabs } = await supabase
    .from("collaborators")
    .select("*", { count: "exact", head: true });

  // 2. Evaluations
  const { data: evals } = await supabase
    .from("evaluations")
    .select(`
      id, created_at, evaluation_year, status,
      result:evaluation_results(*),
      collaborator:collaborators(full_name, positions(name), areas(name))
    `)
    .order("created_at", { ascending: false });
    
  const allEvals = evals || [];
  const completed = allEvals.filter(e => e.status === 'finalizada');
  
  let aprobados = 0;
  let conPMI = 0;
  let reprobados = 0;
  let sumScore = 0;
  let validScores = 0;

  completed.forEach(e => {
    const res = e.result && !Array.isArray(e.result) ? e.result : e.result?.[0] || null;
    if (res) {
      if (res.result === 'aprobado') aprobados++;
      else if (res.result === 'plan_mejoramiento') conPMI++;
      else if (res.result === 'no_aprobado') reprobados++;
      
      sumScore += Number(res.overall_average || 0);
      validScores++;
    }
  });

  const avgScore = validScores > 0 ? sumScore / validScores : 0;

  // Active PMIs
  const { count: pmisCount } = await supabase
    .from("evaluation_results")
    .select("*", { count: "exact", head: true })
    .eq("pmi_required", true);

  return {
    kpis: {
      totalCollabs: totalCollabs || 0,
      completedEvals: completed.length,
      aprobados,
      conPMI,
      reprobados,
      avgScore,
      pmisCount: pmisCount || 0,
    },
    allEvaluations: allEvals.map((e: any) => {
      const res = e.result && !Array.isArray(e.result) ? e.result : e.result?.[0] || null;
      return {
        id: e.id,
        collaborator: e.collaborator?.full_name || "Desconocido",
        position: e.collaborator?.positions?.name || "N/A",
        area: e.collaborator?.areas?.name || "N/A",
        result: res ? res.result : e.status,
        score: Number(res?.overall_average || 0),
        date: e.created_at,
        year: e.evaluation_year
      };
    })
  };
}
