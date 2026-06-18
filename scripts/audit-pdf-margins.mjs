import fs from "fs";

const files = [
  "c:/Users/AUX SISTEMAS/Desktop/1. Antigravity PR/4. IA EVD/evd-sugamuxi/src/app/(dashboard)/evaluaciones/[id]/page.tsx",
  "c:/Users/AUX SISTEMAS/Desktop/1. Antigravity PR/4. IA EVD/evd-sugamuxi/src/app/(dashboard)/evaluaciones/nueva/page.tsx",
  "c:/Users/AUX SISTEMAS/Desktop/1. Antigravity PR/4. IA EVD/evd-sugamuxi/src/app/(dashboard)/evaluaciones/page.tsx",
  "c:/Users/AUX SISTEMAS/Desktop/1. Antigravity PR/4. IA EVD/evd-sugamuxi/src/app/(dashboard)/reportes/page.tsx"
];

files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`File not found: ${file}`);
    return;
  }
  console.log(`\nAuditing: ${file}`);
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  
  // Find all autoTable calls and extract the next 15 lines of configuration
  let idx = 0;
  while (true) {
    const nextCallIdx = lines.slice(idx).findIndex(line => line.includes("autoTable("));
    if (nextCallIdx === -1) break;
    
    const absoluteIdx = idx + nextCallIdx;
    console.log(`  Line ${absoluteIdx + 1}:`);
    
    // Grab the block of options
    let block = "";
    let bracketsCount = 0;
    let started = false;
    let j = absoluteIdx;
    for (; j < lines.length; j++) {
      const line = lines[j];
      block += line + "\n";
      if (line.includes("autoTable(")) {
        started = true;
      }
      // Count curly braces
      for (const char of line) {
        if (char === "{") bracketsCount++;
        if (char === "}") bracketsCount--;
      }
      if (started && bracketsCount === 0) {
        break;
      }
    }
    
    console.log(block.split("\n").map(l => "    " + l.trim()).join("\n"));
    
    // Check if "margin" with top and bottom is defined in the block
    const hasMargin = block.includes("margin:");
    const hasTop = /top:\s*\d+/.test(block);
    const hasBottom = /bottom:\s*\d+/.test(block);
    
    if (!hasMargin) {
      console.log(`    ❌ MISSING margin parameter completely!`);
    } else {
      if (!hasTop) console.log(`    ⚠️ Warning: margin is defined but top is missing!`);
      if (!hasBottom) console.log(`    ⚠️ Warning: margin is defined but bottom is missing!`);
    }
    
    idx = j + 1;
  }
});
