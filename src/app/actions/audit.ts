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

export async function getAuditLogs(limit = 200, filters?: {
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const supabase = await getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: [], error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userData.user.id)
    .single();

  if (!profile?.company_id) return { data: [], error: "Empresa no encontrada" };

  let query = supabase
    .from("audit_logs")
    .select(`
      id,
      action,
      table_name,
      record_id,
      description,
      old_values,
      new_values,
      ip_address,
      user_agent,
      created_at,
      profile:profiles!user_id(first_name, last_name, email)
    `)
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters?.action) {
    query = query.eq("action", filters.action);
  }
  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }
  if (filters?.dateTo) {
    // Add 1 day to include the full day
    const dateTo = new Date(filters.dateTo);
    dateTo.setDate(dateTo.getDate() + 1);
    query = query.lt("created_at", dateTo.toISOString().split("T")[0]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching audit logs:", error);
    return { data: [], error: error.message };
  }

  return { data, error: null };
}

// Function to log an audit event
export async function logAudit(
  action: string,
  table_name: string,
  record_id: string,
  description: string = "",
  old_values: any = null,
  new_values: any = null
) {
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
    table_name,
    record_id,
    description,
    old_values,
    new_values,
    ip_address: "127.0.0.1",
    user_agent: "Next.js App"
  });
}
