import fs from 'fs';

const filePath = 'c:/Users/AUX SISTEMAS/Desktop/1. Antigravity PR/4. IA EVD/evd-sugamuxi/src/app/(dashboard)/evaluaciones/page.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('handlePreviewClick')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
