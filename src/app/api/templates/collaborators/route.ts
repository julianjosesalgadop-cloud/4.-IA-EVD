import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Definir las columnas de la plantilla
    const templateData = [
      {
        "Tipo Documento": "CC",
        "Numero Documento": "100100200",
        "Nombres Completos": "Juan Perez",
        "Email": "juan.perez@flotasugamuxi.com",
        "Area": "Operaciones",
        "Cargo": "Conductor",
      }
    ];

    // Crear hoja de trabajo
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Configurar ancho de columnas
    ws['!cols'] = [
      { wch: 15 }, // Tipo Documento
      { wch: 20 }, // Numero
      { wch: 35 }, // Nombres
      { wch: 35 }, // Email
      { wch: 25 }, // Area
      { wch: 25 }, // Cargo
    ];

    // Crear libro
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Colaboradores");

    // Generar buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Devolver como descarga
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="plantilla_colaboradores.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    console.error("Error generating template:", error);
    return NextResponse.json({ error: "Failed to generate template" }, { status: 500 });
  }
}
