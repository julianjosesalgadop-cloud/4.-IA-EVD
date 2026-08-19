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
      collaborator:collaborators(full_name, workplace_city, payroll_type, positions(name), areas(name))
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

  // Fetch all active collaborators with area and payroll type
  const { data: collabsList } = await supabase
    .from("collaborators")
    .select("id, payroll_type, areas(name)")
    .eq("status", "activo");

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
    collaborators: (collabsList || []).map((c: any) => {
      const areaObj = c.areas && !Array.isArray(c.areas) ? c.areas : c.areas?.[0] || null;
      return {
        id: c.id,
        payroll_type: c.payroll_type || "Sin Especificar",
        area: areaObj?.name || "Sin Área"
      };
    }),
    allEvaluations: allEvals.map((e: any) => {
      const res = e.result && !Array.isArray(e.result) ? e.result : e.result?.[0] || null;
      const collab = e.collaborator && !Array.isArray(e.collaborator) ? e.collaborator : e.collaborator?.[0] || null;
      const posObj = collab?.positions && !Array.isArray(collab.positions) ? collab.positions : collab?.positions?.[0] || null;
      const areaObj = collab?.areas && !Array.isArray(collab.areas) ? collab.areas : collab?.areas?.[0] || null;

      return {
        id: e.id,
        collaborator: collab?.full_name || "Desconocido",
        workplace_city: collab?.workplace_city || "Sogamoso",
        position: posObj?.name || "N/A",
        area: areaObj?.name || "N/A",
        payroll_type: collab?.payroll_type || "Sin Especificar",
        result: res ? res.result : e.status,
        pmi_status: res ? res.pmi_status : null,
        pmi_required: res ? res.pmi_required : false,
        score: Number(res?.overall_average || 0),
        category_scores: res ? res.category_scores : null,
        date: e.created_at,
        year: e.evaluation_year
      };
    })
  };
}
