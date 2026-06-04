import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Faltan credenciales de Supabase en el entorno.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createTestAdmin() {
  console.log("Conectando a Supabase para crear usuario admin...");

  // 1. Crear usuario en Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@flotasugamuxi.com',
    password: 'Password123!',
    email_confirm: true
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log("El usuario admin@flotasugamuxi.com ya existe en Auth.");
      // Intentamos recuperar el ID
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const existingUser = usersData.users.find(u => u.email === 'admin@flotasugamuxi.com');
      if (existingUser) {
        await linkProfile(existingUser.id);
      }
    } else {
      console.error("Error creando usuario Auth:", authError);
    }
  } else {
    console.log("Usuario creado en Auth con ID:", authData.user.id);
    await linkProfile(authData.user.id);
  }
}

async function linkProfile(userId) {
  console.log("Vinculando con tabla profiles...");
  
  // Buscar company_id (Flota Sugamuxi S.A.)
  const { data: company } = await supabase.from('companies').select('id').limit(1).single();
  if (!company) {
    console.error("No se encontró ninguna empresa en la tabla companies. Ejecutaste los scripts SQL?");
    return;
  }

  // Buscar role_id de 'admin'
  const { data: role } = await supabase.from('roles').select('id').eq('name', 'admin').limit(1).single();
  if (!role) {
    console.error("No se encontró el rol admin. Ejecutaste los scripts SQL?");
    return;
  }

  // Crear/Actualizar Profile
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    company_id: company.id,
    role_id: role.id,
    first_name: 'Administrador',
    last_name: 'Sistema',
    email: 'admin@flotasugamuxi.com',
    active: true
  });

  if (profileError) {
    console.error("Error creando profile:", profileError);
  } else {
    console.log("✅ Perfil de administrador creado exitosamente vinculado a la base de datos.");
    console.log("Credenciales de prueba:");
    console.log("Email: admin@flotasugamuxi.com");
    console.log("Password: Password123!");
  }
}

createTestAdmin();
