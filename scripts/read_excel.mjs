import XLSX from 'xlsx';
import path from 'path';

const filePath = "C:\\Users\\AUX SISTEMAS\\Desktop\\1. Antigravity PR\\4. IA EVD\\1. Documentos Base\\INFORMACIÓN COLABORADORES.xlsx";

try {
  console.log('Reading file from:', filePath);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  console.log('Sheet Name:', sheetName);
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  console.log('Total rows:', data.length);
  if (data.length > 0) {
    console.log('First row keys:', Object.keys(data[0]));
    console.log('First row data:', data[0]);
    console.log('Second row data:', data[1]);
  }
} catch (error) {
  console.error('Error reading excel:', error);
}
