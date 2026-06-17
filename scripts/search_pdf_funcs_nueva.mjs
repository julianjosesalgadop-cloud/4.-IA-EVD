import fs from 'fs';

const filePath = 'c:/Users/AUX SISTEMAS/Desktop/1. Antigravity PR/4. IA EVD/evd-sugamuxi/src/app/(dashboard)/evaluaciones/nueva/page.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('generate') || line.includes('pdf') || line.includes('PDF') || line.includes('descargar') || line.includes('export')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
