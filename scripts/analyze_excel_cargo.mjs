import XLSX from 'xlsx';

const filePath = "C:\\Users\\AUX SISTEMAS\\Desktop\\1. Antigravity PR\\4. IA EVD\\1. Documentos Base\\INFORMACIÓN COLABORADORES.xlsx";

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const cargos = new Set();
  const contratos = new Set();
  const estados = new Set();
  const nominas = new Set();

  data.forEach(row => {
    if (row.Cargo) cargos.add(row.Cargo.trim());
    if (row['Tipo Contrato']) contratos.add(row['Tipo Contrato'].trim());
    if (row.Estado) estados.add(row.Estado.trim());
    if (row['Tipo Nomina']) nominas.add(row['Tipo Nomina'].trim());
  });

  console.log('--- UNIQUE CARGOS ---');
  console.log(Array.from(cargos));

  console.log('\n--- UNIQUE CONTRATOS ---');
  console.log(Array.from(contratos));

  console.log('\n--- UNIQUE ESTADOS ---');
  console.log(Array.from(estados));

  console.log('\n--- UNIQUE NOMINAS ---');
  console.log(Array.from(nominas));

} catch (error) {
  console.error('Error:', error);
}
