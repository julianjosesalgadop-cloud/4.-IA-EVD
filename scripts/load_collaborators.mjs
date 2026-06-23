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

const COMPANY_ID = '11111111-0000-0000-0000-000000000001'; // Flota Sugamuxi S.A.

// Helper to convert Excel date serial to Date
function excelDateToDate(excelDate) {
  if (!excelDate) return null;
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  const timezoneOffset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() + timezoneOffset);
}

// Robust date parser
function parseExcelDate(val) {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') {
    const d = excelDateToDate(val);
    return d ? d.toISOString().split('T')[0] : null;
  }
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const dmy = trimmed.split('/');
    if (dmy.length === 3) {
      const day = dmy[0].padStart(2, '0');
      const month = dmy[1].padStart(2, '0');
      const year = dmy[2];
      return `${year}-${month}-${day}`;
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }
  return null;
}

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

// Map cargo/position name to Area ID
function getAreaId(cargo) {
  const c = cargo.toUpperCase();
  if (c.includes('CONDUCTOR') || c.includes('OPERATIVO') || c.includes('RODAMIENTO') || c.includes('SUPERVISOR') || c.includes('RUTAS') || c.includes('DESPACHADOR') || c.includes('GPS')) {
    return '33333333-0000-0000-0000-000000000001'; // Operaciones
  }
  if (c.includes('MANTENIMIENTO') || c.includes('MECANICO') || c.includes('PARQUE AUTOMOTOR')) {
    return '33333333-0000-0000-0000-000000000002'; // Mantenimiento
  }
  if (c.includes('TALENTO HUMANO') || c.includes('PSICOLOGO') || c.includes('BIENESTAR')) {
    return '33333333-0000-0000-0000-000000000003'; // Gestión Humana
  }
  if (c.includes('VENTAS') || c.includes('COMERCIAL') || c.includes('CARGA')) {
    return '33333333-0000-0000-0000-000000000004'; // Comercial
  }
  if (c.includes('CONTABILIDAD') || c.includes('IMPUESTOS') || c.includes('TESORER') || c.includes('CARTERA') || c.includes('BANCOS') || c.includes('FINANCIERO') || c.includes('FACTURACION')) {
    return '33333333-0000-0000-0000-000000000005'; // Financiera
  }
  if (c.includes('SISTEMAS') || c.includes('TECNOLOGIA') || c.includes('COMUNICACIONES')) {
    return '33333333-0000-0000-0000-000000000006'; // Tecnología
  }
  return '8a9f98bc-5ddf-4a19-99cb-7944a775638c'; // Administrativa
}

// Generate unique code for a position
function generatePositionCode(name, existingCodes) {
  let clean = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
  let code = clean.slice(0, 3);
  if (code.length < 3) code = (code + 'POS').slice(0, 3);
  let suffix = 1;
  let finalCode = code;
  while (existingCodes.has(finalCode)) {
    finalCode = code.slice(0, 2) + suffix;
    suffix++;
  }
  existingCodes.add(finalCode);
  return finalCode;
}

// Get position level
function getPositionLevel(name) {
  const n = name.toUpperCase();
  if (n.includes('GERENTE GENERAL')) return 5;
  if (n.includes('GERENTE') || n.includes('DIRECTOR')) return 4;
  if (n.includes('COORDINADOR') || n.includes('JEFE') || n.includes('SUPERVISOR')) return 3;
  if (n.includes('ANALISTA') || n.includes('ASISTENTE') || n.includes('COORDINADOR DE AGENCIA')) return 2;
  return 1; // default level for operational/base profiles
}

// Map contract type
function getContractType(type) {
  if (!type) return 'indefinido';
  const t = type.trim().toUpperCase();
  if (t.includes('FIJO')) return 'fijo';
  if (t.includes('INDEFINIDO')) return 'indefinido';
  if (t.includes('APRENDIZAJE') || t.includes('SENA')) return 'aprendizaje';
  return 'indefinido';
}

async function run() {
  const filePath = "C:\\Users\\AUX SISTEMAS\\Desktop\\1. Antigravity PR\\4. IA EVD\\1. Documentos Base\\INFORMACIÓN COLABORADORES.xlsx";
  console.log('Starting collaborators upload process...');
  
  // 1. Fetch existing positions from DB
  const { data: dbPositions, error: posError } = await supabase
    .from('positions')
    .select('*')
    .eq('company_id', COMPANY_ID);
    
  if (posError) {
    console.error('Error fetching positions:', posError);
    process.exit(1);
  }
  
  const positionsMap = new Map(); // name.toLowerCase() -> id
  const existingCodes = new Set();
  
  dbPositions.forEach(p => {
    positionsMap.set(p.name.trim().toLowerCase(), p.id);
    if (p.code) existingCodes.add(p.code.toUpperCase());
  });
  
  console.log(`Loaded ${dbPositions.length} existing positions.`);
  
  // 2. Read Excel
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`Loaded ${data.length} rows from Excel sheet "${sheetName}".`);
  
  // 3. Process positions and create missing ones
  const newPositionsToCreate = [];
  const cargoToIdMap = new Map(positionsMap);
  
  // Find unique cargos from excel that don't exist in DB
  const uniqueCargosFromExcel = new Set(
    data
      .map(row => row.Cargo ? row.Cargo.trim() : null)
      .filter(cargo => cargo !== null)
  );
  
  for (const cargo of uniqueCargosFromExcel) {
    const key = cargo.toLowerCase();
    if (!cargoToIdMap.has(key)) {
      const code = generatePositionCode(cargo, existingCodes);
      const level = getPositionLevel(cargo);
      const area_id = getAreaId(cargo);
      
      newPositionsToCreate.push({
        company_id: COMPANY_ID,
        name: cargo,
        code,
        level,
        area_id,
        active: true
      });
    }
  }
  
  if (newPositionsToCreate.length > 0) {
    console.log(`Creating ${newPositionsToCreate.length} new positions in the database...`);
    const { data: createdPositions, error: createPosError } = await supabase
      .from('positions')
      .insert(newPositionsToCreate)
      .select();
      
    if (createPosError) {
      console.error('Error creating positions:', createPosError);
      process.exit(1);
    }
    
    createdPositions.forEach(p => {
      cargoToIdMap.set(p.name.trim().toLowerCase(), p.id);
    });
    console.log(`Successfully created new positions.`);
  }
  
  // 4. Map collaborators
  const collaboratorsToUpsert = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const docNumRaw = row['Número de Documento'];
    if (!docNumRaw) {
      console.log(`Row ${i + 2}: Skipping because 'Número de Documento' is missing.`);
      continue;
    }
    
    const docNum = String(docNumRaw).trim();
    if (!docNum) {
      console.log(`Row ${i + 2}: Skipping because 'Número de Documento' is empty.`);
      continue;
    }
    
    const persona = row.Persona || '';
    if (!persona.trim()) {
      console.log(`Row ${i + 2}: Skipping because name 'Persona' is empty.`);
      continue;
    }
    
    const { firstName, lastName } = splitName(persona);
    const cargo = row.Cargo ? row.Cargo.trim() : '';
    const position_id = cargoToIdMap.get(cargo.toLowerCase()) || null;
    const area_id = position_id ? dbPositions.find(p => p.id === position_id)?.area_id || getAreaId(cargo) : getAreaId(cargo);
    
    const phone = row.Celular ? String(row.Celular).trim() : null;
    const email = row.Correo ? String(row.Correo).trim() : null;
    const birth_date = parseExcelDate(row['Fecha Nacimiento']);
    const hire_date = parseExcelDate(row['Fecha Desde']);
    const termination_date = parseExcelDate(row['Fecha Hasta']);
    
    const contract_type = getContractType(row['Tipo Contrato']);
    
    collaboratorsToUpsert.push({
      company_id: COMPANY_ID,
      document_type: 'CC',
      document_number: docNum,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      birth_date,
      hire_date,
      termination_date,
      contract_type,
      position_id,
      area_id,
      status: 'activo',
      active: true
    });
  }
  
  console.log(`Prepared ${collaboratorsToUpsert.length} collaborators for upsert.`);
  
  // 5. Batch upsert collaborators in chunks of 100 to avoid limits or request timeouts
  const CHUNK_SIZE = 100;
  let successCount = 0;
  
  for (let i = 0; i < collaboratorsToUpsert.length; i += CHUNK_SIZE) {
    const chunk = collaboratorsToUpsert.slice(i, i + CHUNK_SIZE);
    console.log(`Upserting chunk ${i / CHUNK_SIZE + 1} (${chunk.length} collaborators)...`);
    
    const { error: upsertError } = await supabase
      .from('collaborators')
      .upsert(chunk, { onConflict: 'company_id,document_number' });
      
    if (upsertError) {
      console.error(`Error upserting chunk ${i / CHUNK_SIZE + 1}:`, upsertError);
    } else {
      successCount += chunk.length;
    }
  }
  
  console.log(`\n🎉 Process completed successfully!`);
  console.log(`Total collaborators processed and upserted: ${successCount} / ${collaboratorsToUpsert.length}`);
}

run();
