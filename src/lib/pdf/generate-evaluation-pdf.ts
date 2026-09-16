import { formatDateTime, formatDate, formatScore, getResultLabel, compressImageIfNeeded } from "@/lib/utils";

export interface GeneratePdfOptions {
  pdfType?: 'colaborador' | 'evaluador';
  overrideCollaboratorSig?: string | null;
}

export async function generateEvaluationPdfDocument(
  evalData: any,
  options: GeneratePdfOptions = {}
): Promise<{ doc: any; fileName: string; blob: Blob; base64: string }> {
  const pdfType = options.pdfType || 'evaluador';
  const overrideCollaboratorSig = options.overrideCollaboratorSig;

  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Load logo image first
  let logoImg: HTMLImageElement | null = null;
  try {
    const logoSrc = await compressImageIfNeeded("/logo.png", 200, 200);
    logoImg = await new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.src = logoSrc;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  } catch (e) {
    console.error("Error loading logo image:", e);
  }

  const brandColorBlue = [1, 33, 105]; // #012169
  const brandColorLightBlue = [0, 132, 213]; // #0084D5
  const textColorDark = [30, 41, 59]; // #1e293b
  const textColorMuted = [100, 116, 139]; // #64748b

  // Page Margins
  const marginX = 15;
  let posY = 20;

  const drawHeader = () => {
    doc.setFillColor(brandColorBlue[0], brandColorBlue[1], brandColorBlue[2]);
    doc.rect(0, 0, 210, 4, "F");
    
    // Draw Logo if loaded (on the left side)
    let textStartX = marginX;
    if (logoImg) {
      try {
        doc.addImage(logoImg, "PNG", marginX, 6, 13, 13);
        textStartX = marginX + 16;
      } catch (err) {
        console.error("Error drawing logo to PDF:", err);
      }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(brandColorBlue[0], brandColorBlue[1], brandColorBlue[2]);
    doc.text("FLOTA SUGAMUXI S.A.", textStartX, 14);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
    doc.text("Sistema de Evaluación de Desempeño (EVD)", textStartX, 19);
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(marginX, 22, 210 - marginX, 22);
  };
  
  const drawFooter = (pageNumber: number, totalPages: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
    
    const currentDate = new Date().toLocaleDateString("es-ES");
    doc.text(`Generado el: ${currentDate}`, marginX, 285);
    doc.text(`Página ${pageNumber} de ${totalPages}`, 210 - marginX, 285, { align: "right" });
    
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, 280, 210 - marginX, 280);
  };

  // PAGE 1: COVER
  posY = 32;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(brandColorBlue[0], brandColorBlue[1], brandColorBlue[2]);
  doc.text("REPORTE DE EVALUACIÓN DE DESEMPEÑO", marginX, posY);
  posY += 8;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
  const dateText = evalData.finalized_at 
    ? `Fecha de Finalización: ${formatDateTime(evalData.finalized_at)}`
    : `Fecha de Registro: ${formatDateTime(evalData.created_at)}`;
  const evalYear = evalData.evaluation_year || new Date().getFullYear();
  doc.text(`${dateText}  |  Año de Evaluación: ${evalYear}`, marginX, posY);
  posY += 10;
  
  // SECTION: COLLABORATOR INFO (EVALUATED)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
  doc.text("1. DATOS DEL COLABORADOR (EVALUADO)", marginX, posY);
  posY += 4;
  
  const collabInfo = [
    ["Nombre Completo:", evalData.collaborator?.full_name || "N/A", "Documento:", `${evalData.collaborator?.document_type || "CC"} ${evalData.collaborator?.document_number || "N/A"}`],
    ["Cargo Actual:", evalData.collaborator?.positions?.name || evalData.collaborator?.position?.name || "N/A", "Área / Departamento:", evalData.collaborator?.areas?.name || evalData.collaborator?.area?.name || "N/A"],
    ["Estado:", evalData.collaborator?.status || "N/A", "", ""]
  ];
  
  autoTable(doc, {
    startY: posY,
    head: [],
    body: collabInfo,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2, textColor: textColorDark as any, lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 35, fillColor: [248, 250, 252] as any },
      1: { cellWidth: 55 },
      2: { fontStyle: "bold", cellWidth: 35, fillColor: [248, 250, 252] as any },
      3: { cellWidth: 55 }
    },
    margin: { left: marginX, right: marginX, top: 26, bottom: 24 }
  });
  
  posY = (doc as any).lastAutoTable.finalY + 8;
  
  // SECTION: EVALUATOR INFO
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
  doc.text("2. DATOS DEL EVALUADOR", marginX, posY);
  posY += 4;
  
  const evaluatorInfo = [
    ["Nombre del Evaluador:", evalData.evaluator ? `${evalData.evaluator.first_name} ${evalData.evaluator.last_name}` : "N/A", "Cargo Actual:", evalData.evaluator?.cargo || evalData.evaluator?.role?.display_name || evalData.evaluator?.roles?.display_name || "N/A"],
    ["Correo Electrónico:", evalData.evaluator?.email || "N/A", "Versión del Proceso EVD:", evalData.version?.name || "N/A"]
  ];
  
  autoTable(doc, {
    startY: posY,
    head: [],
    body: evaluatorInfo,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2, textColor: textColorDark as any, lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45, fillColor: [248, 250, 252] as any },
      1: { cellWidth: 45 },
      2: { fontStyle: "bold", cellWidth: 45, fillColor: [248, 250, 252] as any },
      3: { cellWidth: 45 }
    },
    margin: { left: marginX, right: marginX, top: 26, bottom: 24 }
  });
  
  posY = (doc as any).lastAutoTable.finalY + 8;
  
  // SECTION: SUMMARY OF RESULTS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
  doc.text("3. RESUMEN DE RESULTADOS", marginX, posY);
  posY += 4;
  
  const resultObj = evalData.result && !Array.isArray(evalData.result) ? evalData.result : evalData.result?.[0] || null;
  const overallScore = resultObj ? resultObj.overall_average : 0;
  const statusLabelText = resultObj ? getResultLabel(resultObj.result) : "Pendiente de finalizar";
  let resultGeneralText = statusLabelText.toUpperCase();
  if (resultObj?.result === "plan_mejoramiento") {
    if (resultObj?.has_critical_fails) {
      resultGeneralText = "PLAN DE MEJORAMIENTO (POR CATEGORÍA)";
    } else {
      resultGeneralText = "PLAN DE MEJORAMIENTO (POR PUNTUACIÓN OBTENIDA (PROMEDIO))";
    }
  }
  
  const summaryInfo = [
    ["PUNTUACIÓN OBTENIDA (PROMEDIO):", `${formatScore(overallScore)} / 5.0`],
    ["RESULTADO GENERAL:", resultGeneralText]
  ];
  
  autoTable(doc, {
    startY: posY,
    head: [],
    body: summaryInfo,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2, textColor: textColorDark as any },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 60, fillColor: [248, 250, 252] as any },
      1: { cellWidth: 120 }
    },
    margin: { left: marginX, right: marginX, top: 26, bottom: 24 }
  });
  
  posY = (doc as any).lastAutoTable.finalY + 6;
  if (resultObj?.has_critical_fails && resultObj.critical_fails_detail?.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(239, 68, 68); // Red color
    doc.text("CRITERIOS CRÍTICOS INCUMPLIDOS (Causales de Plan de Mejoramiento):", marginX, posY);
    posY += 4;
    
    const failHeaders = [["Criterio Crítico", "Valor Obtenido", "Mínimo Requerido"]];
    const failRows = resultObj.critical_fails_detail.map((fail: any) => {
      return [
        fail.question || "Criterio Crítico",
        `${formatScore(fail.score)} / 5.0`,
        `${formatScore(fail.min_required)} / 5.0`
      ];
    });

    autoTable(doc, {
      startY: posY,
      head: failHeaders,
      body: failRows,
      theme: "striped",
      headStyles: { fillColor: brandColorBlue as any, textColor: [255, 255, 255] as any, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2, textColor: textColorDark as any },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 120 },
        1: { cellWidth: 30, halign: "center" },
        2: { cellWidth: 30, halign: "center" }
      },
      margin: { left: marginX, right: marginX, top: 26, bottom: 24 }
    });
    posY = (doc as any).lastAutoTable.finalY + 8;
  } else {
    posY = (doc as any).lastAutoTable.finalY + 8;
  }

  // SECTION: CATEGORY SCORES
  const categoryScores = resultObj?.category_scores || {};
  if (categoryScores && Object.keys(categoryScores).length > 0) {
    // Prevent signatures from being on a page by themselves for colaborador
    if (pdfType === "colaborador" && posY > 230) {
      doc.addPage();
      posY = 28;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
    doc.text("4. CALIFICACIÓN POR CATEGORÍA", marginX, posY);
    posY += 6;
    
    const catHeaders = [["Categoría (Preguntas)", "Promedio"]];
    const catRows = Object.entries(categoryScores).map(([_, cat]: [string, any]) => [
      `${cat.name || "Categoría"} (${cat.count || 0} preguntas)`,
      `${formatScore(cat.average || 0)} / 5.0`
    ]);
    
    autoTable(doc, {
      startY: posY,
      head: catHeaders,
      body: catRows,
      theme: "striped",
      headStyles: { fillColor: brandColorBlue as any, textColor: [255, 255, 255] as any, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2, textColor: textColorDark as any },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 155 },
        1: { cellWidth: 25, halign: "center" }
      },
      margin: { left: marginX, right: marginX, top: 26, bottom: 24 }
    });
    
    posY = (doc as any).lastAutoTable.finalY + 8;
  }
  
  if (pdfType === "evaluador") {
    // Check space for Escala and Rangos section
    if (posY > 230) {
      doc.addPage();
      posY = 28;
    }

    // SECTION: ESCALA DE CALIFICACIÓN & RANGOS DE RESULTADOS
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
    doc.text("5. ESCALA DE CALIFICACIÓN", marginX, posY);
    doc.text("6. RANGOS DE RESULTADOS", marginX + 95, posY);
    posY += 6;

    autoTable(doc, {
      startY: posY,
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
      headStyles: { fillColor: brandColorBlue as any, textColor: [255, 255, 255] as any, fontStyle: "bold", halign: "center" },
      styles: { fontSize: 8, cellPadding: 2, textColor: textColorDark as any },
      columnStyles: {
        0: { halign: "center", fontStyle: "bold", cellWidth: 25 },
        1: { cellWidth: 60 }
      }
    });
    const finalY1 = (doc as any).lastAutoTable.finalY;

    autoTable(doc, {
      startY: posY,
      margin: { left: marginX + 95, top: 26, bottom: 24 },
      tableWidth: 85,
      head: [["Promedio", "Resultado"]],
      body: [
        ["4.0 – 5.0", "Aprobado"],
        ["3.1 – 3.9", "Plan de Mejoramiento"],
        ["1.0 - 3.0", "No Aprobado"]
      ],
      theme: "grid",
      headStyles: { fillColor: brandColorBlue as any, textColor: [255, 255, 255] as any, fontStyle: "bold", halign: "center" },
      styles: { fontSize: 8, cellPadding: 2, textColor: textColorDark as any },
      columnStyles: {
        0: { halign: "center", fontStyle: "bold", cellWidth: 35 },
        1: { cellWidth: 50, halign: "center" }
      }
    });
    const finalY2 = (doc as any).lastAutoTable.finalY;

    posY = Math.max(finalY1, finalY2) + 12;

    // DETAILED ANSWERS TABLE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
    doc.text("7. DESGLOSE DETALLADO DE COMPETENCIAS Y PREGUNTAS", marginX, posY);
    posY += 6;
    
    const answersHeaders = [["Categoría", "Pregunta", "Calificación"]];
    const answersRows = (evalData.answers || []).map((ans: any) => [
      ans.category?.name || "N/A",
      ans.question?.question || "Pregunta sin descripción",
      `${ans.score} / 5.0`
    ]);
    
    autoTable(doc, {
      startY: posY,
      head: answersHeaders,
      body: answersRows,
      theme: "striped",
      headStyles: { fillColor: brandColorBlue as any, textColor: [255, 255, 255] as any, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2, textColor: textColorDark as any },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 45 },
        1: { cellWidth: 110 },
        2: { cellWidth: 25, halign: "center" }
      },
      margin: { left: marginX, right: marginX, top: 26, bottom: 24 }
    });
    
    posY = (doc as any).lastAutoTable.finalY + 12;
    
    if (posY > 200) {
      doc.addPage();
      posY = 28;
    }
    
    // SECTION: NARRATIVE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
    doc.text("8. COMENTARIOS Y NARRATIVA DE DESEMPEÑO", marginX, posY);
    posY += 6;
    
    const narratives = [
      ["Observaciones Generales del Evaluador:", evalData.observations || "Sin observaciones registradas."],
      ["Fortalezas Clave Demostradas:", evalData.strengths || "Sin fortalezas registradas."],
      ["Oportunidades de Mejora Identificadas:", evalData.improvement_opportunities || "Sin oportunidades registradas."],
      ["Necesidades de Formación / Capacitación:", evalData.training_needs || "Sin necesidades registradas."]
    ];
    
    autoTable(doc, {
      startY: posY,
      head: [],
      body: narratives,
      theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 3, textColor: textColorDark as any },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 60, fillColor: [248, 250, 252] as any },
        1: { cellWidth: 120 }
      },
      margin: { left: marginX, right: marginX, top: 26, bottom: 24 }
    });
    
    posY = (doc as any).lastAutoTable.finalY + 15;
  }
  
  if (posY > 250) {
    doc.addPage();
    posY = 28;
  }
  
  // SECTION: SIGNATURES
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(brandColorLightBlue[0], brandColorLightBlue[1], brandColorLightBlue[2]);
  doc.text(pdfType === "colaborador" ? "5. CONFORMIDAD Y FIRMAS" : "9. CONFORMIDAD Y FIRMAS", marginX, posY);
  
  const evaluatorSigRaw = evalData.evaluator?.avatar_url;
  const collaboratorSigRaw = overrideCollaboratorSig !== undefined
    ? overrideCollaboratorSig
    : (evalData.draft_data as any)?.collaborator_signature;
  
  const evaluatorSig = evaluatorSigRaw ? await compressImageIfNeeded(evaluatorSigRaw) : null;
  const collaboratorSig = collaboratorSigRaw ? await compressImageIfNeeded(collaboratorSigRaw) : null;
  
  const sigHeight = 11;
  const sigWidth = 38;
  
  if (evaluatorSig) {
    try {
      doc.addImage(evaluatorSig, "PNG", marginX + 16, posY + 2, sigWidth, sigHeight);
    } catch (err) {
      console.error("Error adding evaluator signature to PDF:", err);
    }
  }
  
  if (collaboratorSig) {
    try {
      doc.addImage(collaboratorSig, "PNG", 210 - marginX - 54, posY + 2, sigWidth, sigHeight);
    } catch (err) {
      console.error("Error adding collaborator signature to PDF:", err);
    }
  }

  posY += 15;
  
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.5);
  
  doc.line(marginX, posY, marginX + 70, posY);
  doc.line(210 - marginX - 70, posY, 210 - marginX, posY);
  
  posY += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
  doc.text("Firma del Evaluador", marginX, posY);
  doc.text("Firma del Colaborador Evaluado", 210 - marginX, posY, { align: "right" });
  
  posY += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(textColorMuted[0], textColorMuted[1], textColorMuted[2]);
  doc.text(evalData.evaluator ? `${evalData.evaluator.first_name} ${evalData.evaluator.last_name}` : "Nombre del Evaluador", marginX, posY);
  doc.text(evalData.collaborator?.full_name || "Nombre del Colaborador", 210 - marginX, posY, { align: "right" });
  
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawHeader();
    drawFooter(i, totalPages);
  }
  
  const typeLabel = pdfType === 'colaborador' ? 'Colaborador' : 'Evaluador';
  const fileName = `EVD_${typeLabel}_${evalData.collaborator?.full_name?.replace(/\s+/g, "_") || "Colaborador"}_${evalData.evaluation_year || new Date().getFullYear()}.pdf`;
  
  const blob = doc.output("blob");
  const base64 = doc.output("datauristring").split(",")[1];

  return { doc, fileName, blob, base64 };
}
