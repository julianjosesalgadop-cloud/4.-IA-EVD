import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import fs from 'fs';

// 1. Read env variables from .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or Service Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const COMPANY_ID = '11111111-0000-0000-0000-000000000001';
const LIDER_ROLE_ID = '22222222-0000-0000-0000-000000000004'; // Líder / Jefe

// Split full name in Spanish into first and last names
function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 2) {
    return {
      firstName: parts[0] || '',
      lastName: parts[1] || ''
    };
  }
  if (parts.length === 3) {
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ')
    };
  }
  return {
    firstName: parts.slice(0, 2).join(' '),
    lastName: parts.slice(2).join(' ')
  };
}

async function run() {
  const filePath = "C:\\Users\\AUX SISTEMAS\\Desktop\\1. Antigravity PR\\4. IA EVD\\1. Documentos Base\\INFORMACIÓN COLABORADORES.xlsx";
  console.log('--- Creating Area Leaders (Líder / Jefe) ---');

  // Read Excel
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('lider'));
  if (!sheetName) {
    console.error("No sheet containing 'lider' was found.");
    process.exit(1);
  }
  
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  console.log(`Loaded ${data.length} leaders from sheet "${sheetName}".`);

  // Load existing positions from database
  const { data: dbPositions, error: posError } = await supabase
    .from('positions')
    .select('id, name')
    .eq('company_id', COMPANY_ID);

  if (posError) {
    console.error('Error fetching positions:', posError);
    process.exit(1);
  }

  const positionsMap = new Map(dbPositions.map(p => [p.name.toLowerCase(), p.id]));
  console.log(`Loaded ${dbPositions.length} positions from database.`);

  // Load existing auth users
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
    perPage: 1000
  });

  if (listError) {
    console.error('Error listing auth users:', listError);
    process.exit(1);
  }

  const authUsersMap = new Map(usersData.users.map(u => [u.email.toLowerCase(), u.id]));
  console.log(`Loaded ${usersData.users.length} authenticated users.`);

  let createdCount = 0;
  let updatedCount = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const docNumRaw = row['Número de Documento'];
    const emailRaw = row.Correo;
    const persona = row.Persona;
    const cargo = row.Cargo;

    if (!docNumRaw || !emailRaw || !persona) {
      console.log(`Row ${i + 2}: Skipping because Document, Email, or Name is missing.`);
      continue;
    }

    const docNum = String(docNumRaw).trim();
    const email = String(emailRaw).trim().toLowerCase();
    const name = String(persona).trim();
    const cargoName = cargo ? String(cargo).trim() : '';

    const { firstName, lastName } = splitName(name);
    const positionId = cargoName ? positionsMap.get(cargoName.toLowerCase()) || null : null;

    if (cargoName && !positionId) {
      console.warn(`Row ${i + 2}: Position "${cargoName}" not found in database.`);
    }

    let userId = authUsersMap.get(email);

    if (!userId) {
      // Create new Auth User
      console.log(`Creating Auth user for: ${email}...`);
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: docNum,
        email_confirm: true
      });

      if (createError) {
        console.error(`Error creating Auth user for ${email}:`, createError.message);
        continue;
      }

      userId = createData.user.id;
      createdCount++;
      console.log(`Created Auth user: ${email} (ID: ${userId})`);
    } else {
      // Existing User - Update password
      console.log(`Updating password for existing user: ${email}...`);
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: docNum
      });

      if (updateError) {
        console.error(`Error updating password for ${email}:`, updateError.message);
      }
      updatedCount++;
    }

    // Upsert Profile
    console.log(`Upserting profile for: ${name} (${email})...`);
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      company_id: COMPANY_ID,
      role_id: LIDER_ROLE_ID,
      first_name: firstName,
      last_name: lastName,
      email: email,
      position_id: positionId,
      active: true
    });

    if (profileError) {
      console.error(`Error upserting profile for ${email}:`, profileError.message);
    } else {
      console.log(`Successfully linked/updated profile for ${email}`);
    }
  }

  console.log(`\n🎉 Leader creation and synchronization process completed!`);
  console.log(`Auth users created: ${createdCount}`);
  console.log(`Auth users updated: ${updatedCount}`);
}

run();
