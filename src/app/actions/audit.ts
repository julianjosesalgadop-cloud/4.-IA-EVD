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

export async function getAuditLogs(limit = 100) {
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
    .from("audit_logs")
    .select(`
      id,
      action,
      entity_type,
      entity_id,
      details,
      ip_address,
      user_agent,
      created_at,
      profile:profiles(first_name, last_name, email)
    `)
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching audit logs:", error);
    return { data: [], error: error.message };
  }

  return { data, error: null };
}

// Function to log an audit event
export async function logAudit(action: string, entity_type: string, entity_id: string, details: any = null) {
  const supabase = await getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userData.user.id)
    .single();

  if (!profile?.company_id) return;

  await supabase.from("audit_logs").insert({
    company_id: profile.company_id,
    user_id: userData.user.id,
    action,
    entity_type,
    entity_id,
    details,
    ip_address: "127.0.0.1", // Requires server headers to get real IP
    user_agent: "Next.js App"
  });
}
