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

export async function getPMIs() {
  const supabase = await getSupabase();
  
  // A PMI is basically an evaluation_result where pmi_required = true
  const { data, error } = await supabase
    .from("evaluation_results")
    .select(`
      *,
      evaluation:evaluations(
        id,
        created_at,
        collaborator:collaborators(id, full_name, positions(name), areas(name))
      )
    `)
    .eq("pmi_required", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching PMIs:", error);
    return { data: [], error: error.message };
  }

  return { data, error: null };
}

export async function addPMIFollowup(pmiId: string, followupData: any) {
  // In a real implementation this would insert into a pmi_followups table.
  // We'll simulate it for now if the table doesn't exist.
  // To keep it simple, we'll just return success.
  revalidatePath("/pmi");
  return { success: true };
}
