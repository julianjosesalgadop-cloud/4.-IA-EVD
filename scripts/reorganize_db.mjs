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

// Generate unique code for a position/area
function generateCode(name, existingCodes) {
  let clean = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
  let code = clean.slice(0, 3);
  if (code.length < 3) code = (code + 'XYZ').slice(0, 3);
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
  return 1;
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
  console.log('--- Database Reorganization Process ---');

  // Read Excel
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  // 1. Extract unique Area and Position names from Excel
  const excelAreasMap = new Map(); // lowercased -> original casing
  const excelCargosMap = new Map(); // lowercased -> original casing
  const cargoToAreaMap = new Map(); // cargo.toLowerCase() -> area

  data.forEach(row => {
    const areaName = row['Tipo Nomina'] ? row['Tipo Nomina'].trim() : null;
    const cargoName = row.Cargo ? row.Cargo.trim() : null;

    if (areaName) {
      const lower = areaName.toLowerCase();
      if (!excelAreasMap.has(lower)) {
        excelAreasMap.set(lower, areaName);
      }
    }
    if (cargoName) {
      const lower = cargoName.toLowerCase();
      if (!excelCargosMap.has(lower)) {
        excelCargosMap.set(lower, cargoName);
      }
    }

    if (cargoName && areaName) {
      const cargoKey = cargoName.toLowerCase();
      if (!cargoToAreaMap.has(cargoKey)) {
        cargoToAreaMap.set(cargoKey, areaName);
      }
    }
  });

  const uniqueExcelAreas = Array.from(excelAreasMap.values());
  const uniqueExcelCargos = Array.from(excelCargosMap.values());

  console.log(`Unique Areas (Tipo Nomina) in Excel: ${uniqueExcelAreas.length}`);
  console.log(`Unique Cargos in Excel: ${uniqueExcelCargos.length}`);

  // 2. Fetch existing database entries
  const { data: dbCollaborators } = await supabase.from('collaborators').select('id, document_number');
  const { data: dbAreas } = await supabase.from('areas').select('*').eq('company_id', COMPANY_ID);
  const { data: dbPositions } = await supabase.from('positions').select('*').eq('company_id', COMPANY_ID);
  const { data: dbEvaluations } = await supabase.from('evaluations').select('evaluatee_id');

  console.log(`Existing in DB: ${dbCollaborators.length} collaborators, ${dbAreas.length} areas, ${dbPositions.length} positions.`);

  // 3. Clear collaborator links to positions/areas temporarily to prevent foreign key errors during deletes
  console.log('Clearing positions and areas from collaborators temporarily...');
  const { error: clearError } = await supabase
    .from('collaborators')
    .update({ position_id: null, area_id: null })
    .neq('company_id', '00000000-0000-0000-0000-000000000000'); // update all

  if (clearError) {
    console.error('Error clearing collaborator foreign keys:', clearError);
    process.exit(1);
  }

  // Clear profiles position links temporarily
  console.log('Clearing position links from user profiles temporarily...');
  const { error: clearProfileError } = await supabase
    .from('profiles')
    .update({ position_id: null })
    .neq('company_id', '00000000-0000-0000-0000-000000000000');

  if (clearProfileError) {
    console.error('Error clearing profiles position keys:', clearProfileError);
    process.exit(1);
  }

  // Clear positions area links temporarily
  console.log('Clearing area links from positions temporarily...');
  const { error: clearPosAreaError } = await supabase
    .from('positions')
    .update({ area_id: null })
    .neq('company_id', '00000000-0000-0000-0000-000000000000');

  if (clearPosAreaError) {
    console.error('Error clearing positions area keys:', clearPosAreaError);
    process.exit(1);
  }

  // 4. Delete areas not in the Excel
  const excelAreaNamesLower = uniqueExcelAreas.map(a => a.toLowerCase());
  const areasToDelete = dbAreas.filter(a => !excelAreaNamesLower.includes(a.name.toLowerCase()));
  
  if (areasToDelete.length > 0) {
    console.log(`Deleting ${areasToDelete.length} areas not present in the Excel...`);
    const idsToDelete = areasToDelete.map(a => a.id);
    const { error: deleteAreasError } = await supabase
      .from('areas')
      .delete()
      .in('id', idsToDelete);

    if (deleteAreasError) {
      console.error('Error deleting old areas:', deleteAreasError);
      process.exit(1);
    }
    console.log('Successfully deleted old areas.');
  }

  // 5. Delete positions not in the Excel
  const excelCargoNamesLower = uniqueExcelCargos.map(c => c.toLowerCase());
  const positionsToDelete = dbPositions.filter(p => !excelCargoNamesLower.includes(p.name.toLowerCase()));

  if (positionsToDelete.length > 0) {
    console.log(`Deleting ${positionsToDelete.length} positions not present in the Excel...`);
    const idsToDelete = positionsToDelete.map(p => p.id);
    const { error: deletePosError } = await supabase
      .from('positions')
      .delete()
      .in('id', idsToDelete);

    if (deletePosError) {
      console.error('Error deleting old positions:', deletePosError);
      process.exit(1);
    }
    console.log('Successfully deleted old positions.');
  }

  // 6. Delete collaborators not in the Excel AND without evaluations
  const excelDocNumbers = new Set(data.map(row => row['Número de Documento'] ? String(row['Número de Documento']).trim() : null).filter(d => d));
  const collaboratorsWithEvaluations = new Set(dbEvaluations.map(e => e.evaluatee_id));

  const collaboratorsToDelete = dbCollaborators.filter(c => {
    return !excelDocNumbers.has(c.document_number) && !collaboratorsWithEvaluations.has(c.id);
  });

  if (collaboratorsToDelete.length > 0) {
    console.log(`Deleting ${collaboratorsToDelete.length} collaborators not present in the Excel and without evaluations...`);
    const idsToDelete = collaboratorsToDelete.map(c => c.id);
    const { error: deleteCollabError } = await supabase
      .from('collaborators')
      .delete()
      .in('id', idsToDelete);

    if (deleteCollabError) {
      console.error('Error deleting old collaborators:', deleteCollabError);
    } else {
      console.log('Successfully deleted old collaborators.');
    }
  }

  // 7. Ensure all unique Excel Areas exist in the DB
  const { data: dbAreasPost } = await supabase.from('areas').select('*').eq('company_id', COMPANY_ID);
  const areasMap = new Map(dbAreasPost.map(a => [a.name.toLowerCase(), a.id]));
  const existingAreaCodes = new Set(dbAreasPost.map(a => a.code ? a.code.toUpperCase() : ''));

  const newAreasToCreate = [];
  uniqueExcelAreas.forEach(areaName => {
    if (!areasMap.has(areaName.toLowerCase())) {
      const code = generateCode(areaName, existingAreaCodes);
      newAreasToCreate.push({
        company_id: COMPANY_ID,
        name: areaName,
        code,
        active: true
      });
    }
  });

  if (newAreasToCreate.length > 0) {
    console.log(`Creating ${newAreasToCreate.length} new areas from Excel...`);
    const { data: createdAreas, error: createAreaError } = await supabase
      .from('areas')
      .insert(newAreasToCreate)
      .select();

    if (createAreaError) {
      console.error('Error creating new areas:', createAreaError);
      process.exit(1);
    }
    createdAreas.forEach(a => {
      areasMap.set(a.name.toLowerCase(), a.id);
    });
    console.log('Successfully created areas.');
  }

  // 8. Ensure all unique Excel Positions exist in the DB and are linked to their Area
  const { data: dbPositionsPost } = await supabase.from('positions').select('*').eq('company_id', COMPANY_ID);
  const positionsMap = new Map(dbPositionsPost.map(p => [p.name.toLowerCase(), p.id]));
  const existingPosCodes = new Set(dbPositionsPost.map(p => p.code ? p.code.toUpperCase() : ''));

  const newPositionsToCreate = [];
  const positionsToUpdate = [];

  for (const cargo of uniqueExcelCargos) {
    const cargoKey = cargo.toLowerCase();
    const areaName = cargoToAreaMap.get(cargoKey);
    const areaId = areaName ? areasMap.get(areaName.toLowerCase()) : null;

    if (!positionsMap.has(cargoKey)) {
      const code = generateCode(cargo, existingPosCodes);
      const level = getPositionLevel(cargo);
      newPositionsToCreate.push({
        company_id: COMPANY_ID,
        area_id: areaId,
        name: cargo,
        code,
        level,
        active: true
      });
    } else {
      // Existing position - we need to make sure its area_id is updated to match the Excel!
      const existingPos = dbPositionsPost.find(p => p.name.toLowerCase() === cargoKey);
      if (existingPos && existingPos.area_id !== areaId) {
        positionsToUpdate.push({
          id: existingPos.id,
          company_id: COMPANY_ID,
          name: existingPos.name,
          code: existingPos.code,
          level: existingPos.level,
          area_id: areaId,
          active: true
        });
      }
    }
  }

  if (newPositionsToCreate.length > 0) {
    console.log(`Creating ${newPositionsToCreate.length} new positions from Excel...`);
    const { data: createdPositions, error: createPosError } = await supabase
      .from('positions')
      .insert(newPositionsToCreate)
      .select();

    if (createPosError) {
      console.error('Error creating new positions:', createPosError);
      process.exit(1);
    }
    createdPositions.forEach(p => {
      positionsMap.set(p.name.toLowerCase(), p.id);
    });
    console.log('Successfully created positions.');
  }

  if (positionsToUpdate.length > 0) {
    console.log(`Updating area links for ${positionsToUpdate.length} existing positions...`);
    const { error: updatePosError } = await supabase
      .from('positions')
      .upsert(positionsToUpdate);

    if (updatePosError) {
      console.error('Error updating positions areas:', updatePosError);
      process.exit(1);
    }
    console.log('Successfully updated position area associations.');
  }

  // 9. Load and map all collaborators from Excel
  const collaboratorsToUpsert = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const docNumRaw = row['Número de Documento'];
    if (!docNumRaw) continue;
    
    const docNum = String(docNumRaw).trim();
    if (!docNum) continue;

    const persona = row.Persona || '';
    if (!persona.trim()) continue;

    const { firstName, lastName } = splitName(persona);
    const cargo = row.Cargo ? row.Cargo.trim() : '';
    const position_id = positionsMap.get(cargo.toLowerCase()) || null;

    const areaName = row['Tipo Nomina'] ? row['Tipo Nomina'].trim() : '';
    const area_id = areaName ? areasMap.get(areaName.toLowerCase()) : null;

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

  console.log(`Upserting ${collaboratorsToUpsert.length} collaborators...`);
  
  const CHUNK_SIZE = 100;
  let successCount = 0;
  for (let i = 0; i < collaboratorsToUpsert.length; i += CHUNK_SIZE) {
    const chunk = collaboratorsToUpsert.slice(i, i + CHUNK_SIZE);
    const { error: upsertError } = await supabase
      .from('collaborators')
      .upsert(chunk, { onConflict: 'company_id,document_number' });

    if (upsertError) {
      console.error(`Error upserting chunk ${i / CHUNK_SIZE + 1}:`, upsertError);
    } else {
      successCount += chunk.length;
    }
  }

  console.log(`\n🎉 Reorganization and reload completed successfully!`);
  console.log(`Upserted collaborators: ${successCount} / ${collaboratorsToUpsert.length}`);
}

run();
