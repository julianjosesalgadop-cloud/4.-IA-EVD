import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { User } from "lucide-react";

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      *,
      roles(id, name, display_name),
      companies:company_id(id, name)
    `)
    .eq("id", userData.user.id)
    .single();

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <User className="w-16 h-16 text-muted-foreground/30" />
        <h2 className="text-2xl font-bold">Perfil no encontrado</h2>
        <p className="text-muted-foreground">Hubo un problema al cargar tu perfil. Contacta al administrador.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">Gestiona tu información personal y configuración de la cuenta.</p>
      </div>

      <div className="space-y-6">
        <ProfileForm initialData={profile} />
        <PasswordForm />
      </div>
    </div>
  );
}
