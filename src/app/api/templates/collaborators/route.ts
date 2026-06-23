import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Definir las columnas de la plantilla bajo la nueva configuración
    const templateData = [
      {
        "Tipo Contrato": "TERMINO INDEFINIDO",
        "Area": "ADMINISTRATIVOS",
        "Cargo": "Auxiliar de Ventas",
        "Fecha Desde": "2024-01-15",
        "Fecha Hasta": "",
        "Fecha Nacimiento": "1995-10-24",
        "Número de Documento": "100100200",
        "Persona": "Juan Perez",
        "Estado": "ACTIVO",
        "Correo": "juan.perez@flotasugamuxi.com",
        "Celular": "3001234567"
      },
      {
        "Tipo Contrato": "TERMINO FIJO",
        "Area": "CONDUCTORES",
        "Cargo": "Conductor",
        "Fecha Desde": "2024-03-01",
        "Fecha Hasta": "2024-09-01",
        "Fecha Nacimiento": "1990-05-12",
        "Número de Documento": "100300400",
        "Persona": "Carlos Martinez",
        "Estado": "ACTIVO",
        "Correo": "carlos.martinez@flotasugamuxi.com",
        "Celular": "3109876543"
      }
    ];

    // Crear hoja de trabajo
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Configurar ancho de columnas
    ws['!cols'] = [
      { wch: 25 }, // Tipo Contrato
      { wch: 20 }, // Area
      { wch: 25 }, // Cargo
      { wch: 15 }, // Fecha Desde
      { wch: 15 }, // Fecha Hasta
      { wch: 18 }, // Fecha Nacimiento
      { wch: 22 }, // Número de Documento
      { wch: 35 }, // Persona
      { wch: 12 }, // Estado
      { wch: 35 }, // Correo
      { wch: 15 }, // Celular
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
