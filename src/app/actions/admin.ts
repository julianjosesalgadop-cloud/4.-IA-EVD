"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ==========================================
// PROFILES (Usuarios)
// ==========================================

export async function getProfiles() {
  const supabaseUser = await getSupabase();
  const { data: userData } = await supabaseUser.auth.getUser();
  if (!userData.user) return { data: [], error: "No autenticado" };

  const adminClient = getSupabaseAdmin();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("company_id")
    .eq("id", userData.user.id)
    .single();

  if (!profile?.company_id) return { data: [], error: "Empresa no encontrada" };

  const { data, error } = await adminClient
    .from("profiles")
    .select(`
      *,
      roles(id, name, display_name)
    `)
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching profiles:", error);
    return { data: [], error: error.message };
  }

  return { data, error: null };
}

export async function updateProfile(userId: string, updates: {
  first_name?: string;
  last_name?: string;
  phone?: string;
  role_id?: string;
  active?: boolean;
}) {
  const supabase = await getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    console.error("Error updating profile:", error);
    return { error: error.message };
  }

  revalidatePath("/administracion/usuarios");
  return { success: true };
}

export async function inviteUser(data: {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role_id?: string;
}) {
  const supabase = await getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "No autenticado" };

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userData.user.id)
    .single();

  if (!currentProfile?.company_id) return { error: "Empresa no encontrada" };

  // Check if user already exists in this company
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", data.email)
    .eq("company_id", currentProfile.company_id)
    .single();

  if (existing) return { error: "Ya existe un usuario con ese correo en la empresa" };

  // Use admin auth to invite user — we use service role via the action
  // For now, create a temporary profile with the invitation data
  const tempId = crypto.randomUUID();
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: tempId,
      company_id: currentProfile.company_id,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone || null,
      role_id: data.role_id || null,
      active: true,
    });

  if (profileError) {
    // If profile can't be created directly, we note that admin needs to use Supabase Auth
    console.error("Profile insert error:", profileError);
    return { 
      error: "Para crear usuarios nuevos, el usuario debe registrarse con ese correo o usar la invitación desde Supabase Dashboard. El perfil se creará automáticamente al primer inicio de sesión." 
    };
  }

  revalidatePath("/administracion/usuarios");
  return { success: true };
}

// ==========================================
// ROLES
// ==========================================

export async function getRoles() {
  const supabaseUser = await getSupabase();
  const { data: userData } = await supabaseUser.auth.getUser();
  if (!userData.user) return { data: [], error: "No autenticado" };

  const adminClient = getSupabaseAdmin();
  const { data, error } = await adminClient
    .from("roles")
    .select("*")
    .order("name");

  if (error) return { data: [], error: error.message };
  return { data, error: null };
}

export async function updateRole(roleId: string, updates: {
  display_name?: string;
  description?: string;
}) {
  const supabaseUser = await getSupabase();
  const { data: userData } = await supabaseUser.auth.getUser();
  if (!userData.user) return { error: "No autenticado" };

  const adminClient = getSupabaseAdmin();
  const { error } = await adminClient
    .from("roles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", roleId);

  if (error) return { error: error.message };

  revalidatePath("/administracion/roles");
  return { success: true };
}

export async function getPermissions(roleId: string) {
  const supabaseUser = await getSupabase();
  const { data: userData } = await supabaseUser.auth.getUser();
  if (!userData.user) return { data: [], error: "No autenticado" };

  const adminClient = getSupabaseAdmin();
  const { data, error } = await adminClient
    .from("permissions")
    .select("*")
    .eq("role_id", roleId)
    .order("module");

  if (error) return { data: [], error: error.message };
  return { data, error: null };
}

export async function updatePermissions(roleId: string, perms: Array<{
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_approve: boolean;
}>) {
  const supabaseUser = await getSupabase();
  const { data: userData } = await supabaseUser.auth.getUser();
  if (!userData.user) return { error: "No autenticado" };

  const adminClient = getSupabaseAdmin();
  for (const perm of perms) {
    const { error } = await adminClient
      .from("permissions")
      .upsert({
        role_id: roleId,
        module: perm.module,
        can_view: perm.can_view,
        can_create: perm.can_create,
        can_edit: perm.can_edit,
        can_delete: perm.can_delete,
        can_export: perm.can_export,
        can_approve: perm.can_approve,
      }, { onConflict: "role_id,module" });

    if (error) {
      console.error("Permission upsert error:", error);
      return { error: error.message };
    }
  }

  revalidatePath("/administracion/roles");
  return { success: true };
}

export async function getCompany() {
  const supabase = await getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: null, error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userData.user.id)
    .single();

  if (!profile?.company_id) return { data: null, error: "Empresa no encontrada" };

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", profile.company_id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}
