import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";

async function runTest() {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const marginX = 15;
  // Let's start the table near the bottom of page 1, e.g. startY = 255
  autoTable(doc, {
    startY: 255,
    margin: { left: marginX, top: 26, bottom: 24 },
    tableWidth: 85,
    head: [["Calificación", "Descripción"]],
    body: [
      ["5", "Excelente"],
      ["4", "Sobresaliente"],
      ["3", "Cumple lo esperado"],
      ["2", "Requiere mejora"],
      ["1", "No cumple"]
    ],
    theme: "grid",
    headStyles: { fillColor: [1, 33, 105], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
    styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { halign: "center", fontStyle: "bold", cellWidth: 25 },
      1: { cellWidth: 60 }
    },
    didDrawCell: (data) => {
      // Print page number and Y position of drawing cells to see where it draws on page 2
      console.log(`Page: ${data.pageNumber}, Section: ${data.section}, Row: ${data.row ? data.row.index : -1}, Y: ${data.cell.y}`);
    }
  });

  fs.writeFileSync("C:/Users/AUX SISTEMAS/.gemini/antigravity/brain/762986a5-3892-4ae1-b010-6d737e028d03/scratch/test_pagebreak.pdf", doc.output("arraybuffer"));
  console.log("Saved test_pagebreak.pdf");
}

runTest().catch(console.error);
