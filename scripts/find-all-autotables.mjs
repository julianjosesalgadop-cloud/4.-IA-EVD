import fs from "fs";
import path from "path";

const rootDir = "c:/Users/AUX SISTEMAS/Desktop/1. Antigravity PR/4. IA EVD/evd-sugamuxi/src";

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk(rootDir);

files.forEach(file => {
  const content = fs.readFileSync(file, "utf8");
  if (content.includes("autoTable(")) {
    console.log(`\nFile: ${file}`);
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      if (line.includes("autoTable(")) {
        console.log(`  Line ${idx + 1}: ${line.trim()}`);
        // print next 10 lines
        for (let i = idx + 1; i < Math.min(lines.length, idx + 12); i++) {
          console.log(`    [${i + 1}]: ${lines[i]}`);
        }
      }
    });
  }
});
