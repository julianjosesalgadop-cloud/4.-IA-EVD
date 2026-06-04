"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Download, FileSpreadsheet, CheckCircle2,
  AlertCircle, X, ChevronLeft, Info, Users
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { importCollaborators } from "@/app/actions/collaborators";

interface CollaboratorRow {
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  correo?: string;
  celular?: string;
  area: string;
  cargo: string;
  tipo_contrato?: string;
  fecha_ingreso: string;
  estado?: string;
  errors?: string[];
  isValid?: boolean;
}

const REQUIRED_COLUMNS = [
  "tipo_documento", "numero_documento", "nombres", "apellidos",
  "area", "cargo", "fecha_ingreso"
];

const TEMPLATE_DATA = [
  {
    tipo_documento: "CC",
    numero_documento: "19234567",
    nombres: "Carlos Alberto",
    apellidos: "Martínez Rojas",
    correo: "c.martinez@sugamuxi.com",
    celular: "3001234567",
    area: "Operaciones",
    cargo: "Conductor",
    tipo_contrato: "indefinido",
    fecha_ingreso: "2024-01-15",
    estado: "activo",
  },
  {
    tipo_documento: "CC",
    numero_documento: "52345678",
    nombres: "Ana María",
    apellidos: "Gómez Pérez",
    correo: "a.gomez@sugamuxi.com",
    celular: "3109876543",
    area: "Operaciones",
    cargo: "Despachadora",
    tipo_contrato: "fijo",
    fecha_ingreso: "2024-03-01",
    estado: "activo",
  },
];

function downloadTemplate() {
  const ws = XLSX.utils.json_to_sheet(TEMPLATE_DATA);
  // Style header row
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) continue;
    ws[cellAddress].s = { font: { bold: true }, fill: { fgColor: { rgb: "1E40AF" } } };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Colaboradores");

  // Add instructions sheet
  const wsInst = XLSX.utils.aoa_to_sheet([
    ["INSTRUCCIONES DE IMPORTACIÓN — EVD FLOTA SUGAMUXI"],
    [""],
    ["COLUMNAS REQUERIDAS:", "tipo_documento, numero_documento, nombres, apellidos, area, cargo, fecha_ingreso"],
    ["COLUMNAS OPCIONALES:", "correo, celular, tipo_contrato, estado"],
    [""],
    ["VALORES VÁLIDOS:"],
    ["tipo_documento:", "CC, CE, TI, PP, NIT, RUT"],
    ["tipo_contrato:", "indefinido, fijo, obra_labor, aprendizaje, prestacion_servicios, temporal"],
    ["estado:", "activo, inactivo, vacaciones, incapacidad"],
    ["fecha_ingreso:", "Formato YYYY-MM-DD (Ej: 2024-01-15)"],
    [""],
    ["ÁREAS VÁLIDAS:", "Operaciones, Mantenimiento, Gestión Humana, Comercial, Financiera, Tecnología"],
    [""],
    ["NOTAS:"],
    ["- No modifiques los nombres de las columnas"],
    ["- Los campos requeridos no pueden estar vacíos"],
    ["- El número de documento debe ser único"],
  ]);
  XLSX.utils.book_append_sheet(wb, wsInst, "Instrucciones");

  XLSX.writeFile(wb, "plantilla_colaboradores_evd.xlsx");
}

function validateRow(row: CollaboratorRow): CollaboratorRow {
  const errors: string[] = [];

  if (!["CC", "CE", "TI", "PP", "NIT", "RUT"].includes(row.tipo_documento?.toUpperCase())) {
    errors.push("Tipo de documento inválido");
  }
  if (!row.numero_documento || row.numero_documento.toString().length < 5) {
    errors.push("Número de documento inválido");
  }
  if (!row.nombres || row.nombres.trim().length < 2) {
    errors.push("Nombres requeridos");
  }
  if (!row.apellidos || row.apellidos.trim().length < 2) {
    errors.push("Apellidos requeridos");
  }
  if (!row.area) errors.push("Área requerida");
  if (!row.cargo) errors.push("Cargo requerido");
  if (!row.fecha_ingreso) errors.push("Fecha de ingreso requerida");
  if (row.correo && !/\S+@\S+\.\S+/.test(row.correo)) {
    errors.push("Correo electrónico inválido");
  }

  return { ...row, errors, isValid: errors.length === 0 };
}

export default function ImportarPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<CollaboratorRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);

  const processFile = useCallback((f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const jsonData = XLSX.utils.sheet_to_json<CollaboratorRow>(ws);

        const validated = jsonData.map(validateRow);
        setRows(validated);
        setStep("preview");
      } catch {
        toast.error("Error al leer el archivo. Verifica que sea un archivo Excel válido.");
      }
    };
    reader.readAsArrayBuffer(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".csv"))) {
      processFile(f);
    } else {
      toast.error("Solo se aceptan archivos .xlsx o .csv");
    }
  }, [processFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleImport = async () => {
    const validRows = rows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error("No hay registros válidos para importar");
      return;
    }

    setStep("importing");
    setImportProgress(30);
    setImportedCount(0);

    try {
      const res = await importCollaborators(validRows);
      
      if (res.error) {
        toast.error(res.error);
        setStep("preview");
        return;
      }
      
      setImportProgress(100);
      setImportedCount(validRows.length);
      await new Promise((r) => setTimeout(r, 500));
      setStep("done");
      toast.success(`${validRows.length} colaboradores importados exitosamente`);
    } catch (err) {
      toast.error("Error inesperado en la importación");
      setStep("preview");
    }
  };

  const validCount = rows.filter((r) => r.isValid).length;
  const errorCount = rows.filter((r) => !r.isValid).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <Link href="/colaboradores" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Volver a Colaboradores
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Importación Masiva</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Carga múltiples colaboradores desde un archivo Excel o CSV
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* STEP: Upload */}
        {step === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            {/* Instructions */}
            <div className="flex items-start gap-3 p-4 rounded-xl border border-brand-200 bg-brand-50 dark:bg-brand-950/20">
              <Info className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm space-y-1">
                <p className="font-semibold text-brand-700 dark:text-brand-400">Instrucciones</p>
                <ul className="text-brand-600/80 dark:text-brand-400/80 space-y-0.5 text-xs list-disc list-inside">
                  <li>Descarga la plantilla oficial y llénala con los datos de los colaboradores</li>
                  <li>No modifiques los nombres de las columnas</li>
                  <li>Los campos marcados con * son obligatorios</li>
                  <li>La fecha de ingreso debe estar en formato YYYY-MM-DD</li>
                  <li>Los colaboradores duplicados (mismo documento) serán ignorados</li>
                </ul>
              </div>
            </div>

            {/* Download template */}
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-3 w-full p-4 rounded-xl border border-dashed hover:border-primary hover:bg-accent transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-success-50 dark:bg-success-950/30 flex items-center justify-center group-hover:bg-success-100 transition-colors">
                <Download className="w-5 h-5 text-success-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Descargar Plantilla Excel</p>
                <p className="text-xs text-muted-foreground">plantilla_colaboradores_evd.xlsx — Con instrucciones incluidas</p>
              </div>
              <FileSpreadsheet className="w-5 h-5 text-success-500 ml-auto" />
            </button>

            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "relative flex flex-col items-center justify-center gap-4 p-12 rounded-xl border-2 border-dashed transition-all cursor-pointer",
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border hover:border-primary/50 hover:bg-accent/30"
              )}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileInput}
                className="hidden"
              />

              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
                isDragging ? "bg-primary/10" : "bg-muted"
              )}>
                <Upload className={cn("w-8 h-8", isDragging ? "text-primary" : "text-muted-foreground")} />
              </div>

              <div className="text-center">
                <p className="font-semibold text-lg">
                  {isDragging ? "Suelta el archivo aquí" : "Arrastra tu archivo aquí"}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  o <span className="text-primary font-medium cursor-pointer hover:underline">haz clic para seleccionar</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">Formatos aceptados: .xlsx, .csv · Máximo 10 MB</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP: Preview */}
        {step === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border bg-card text-center">
                <p className="text-3xl font-bold">{rows.length}</p>
                <p className="text-sm text-muted-foreground">Total registros</p>
              </div>
              <div className="p-4 rounded-xl border bg-success-50 dark:bg-success-950/20 text-center border-success-200">
                <p className="text-3xl font-bold text-success-600">{validCount}</p>
                <p className="text-sm text-success-600/80">Válidos</p>
              </div>
              <div className={cn(
                "p-4 rounded-xl border text-center",
                errorCount > 0 ? "bg-danger-50 dark:bg-danger-950/20 border-danger-200" : "bg-card"
              )}>
                <p className={cn("text-3xl font-bold", errorCount > 0 ? "text-danger-600" : "text-muted-foreground")}>{errorCount}</p>
                <p className={cn("text-sm", errorCount > 0 ? "text-danger-600/80" : "text-muted-foreground")}>Con errores</p>
              </div>
            </div>

            {/* File info */}
            <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
              <FileSpreadsheet className="w-5 h-5 text-success-500" />
              <span className="text-sm font-medium">{file?.name}</span>
              <button onClick={() => { setFile(null); setRows([]); setStep("upload"); }} className="ml-auto p-1 rounded-lg hover:bg-accent transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Preview Table */}
            <div className="rounded-xl border overflow-hidden">
              <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
                <p className="text-sm font-semibold">Vista previa (primeros 20)</p>
                <p className="text-xs text-muted-foreground">{file?.name}</p>
              </div>
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-xs">
                  <thead className="bg-muted/20 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Estado</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Documento</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Nombre</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Área</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Cargo</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Errores</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.slice(0, 20).map((row, i) => (
                      <tr key={i} className={cn(row.isValid ? "" : "bg-danger-50/30 dark:bg-danger-950/10")}>
                        <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                        <td className="px-3 py-2">
                          {row.isValid ? (
                            <CheckCircle2 className="w-4 h-4 text-success-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-danger-500" />
                          )}
                        </td>
                        <td className="px-3 py-2">{row.tipo_documento} {row.numero_documento}</td>
                        <td className="px-3 py-2 font-medium">{row.nombres} {row.apellidos}</td>
                        <td className="px-3 py-2">{row.area}</td>
                        <td className="px-3 py-2">{row.cargo}</td>
                        <td className="px-3 py-2 text-danger-500">{row.errors?.join("; ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setFile(null); setRows([]); setStep("upload"); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm hover:bg-accent transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Cargar otro archivo
              </button>
              <button
                onClick={handleImport}
                disabled={validCount === 0}
                className="flex items-center gap-2 px-6 py-2 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md disabled:opacity-50"
              >
                <Users className="w-4 h-4" />
                Importar {validCount} colaboradores
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP: Importing */}
        {step === "importing" && (
          <motion.div
            key="importing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 gap-6"
          >
            <div className="w-20 h-20 rounded-2xl gradient-brand flex items-center justify-center animate-pulse-slow">
              <Users className="w-10 h-10 text-white" />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">Importando colaboradores...</p>
              <p className="text-muted-foreground mt-1">{importedCount} de {validCount} procesados</p>
            </div>
            <div className="w-full max-w-sm">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full gradient-brand rounded-full"
                  animate={{ width: `${importProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-center text-sm font-semibold mt-2">{importProgress}%</p>
            </div>
          </motion.div>
        )}

        {/* STEP: Done */}
        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 gap-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-success-100 dark:bg-success-950/30 flex items-center justify-center"
            >
              <CheckCircle2 className="w-10 h-10 text-success-500" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold">¡Importación completada!</h2>
              <p className="text-muted-foreground mt-2">
                <strong>{validCount}</strong> colaboradores fueron importados exitosamente.
                {errorCount > 0 && ` ${errorCount} registros fueron omitidos por errores.`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/colaboradores">
                <button className="px-6 py-2 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md">
                  Ver Colaboradores
                </button>
              </Link>
              <button
                onClick={() => { setFile(null); setRows([]); setStep("upload"); setImportProgress(0); setImportedCount(0); }}
                className="px-6 py-2 rounded-xl border text-sm font-medium hover:bg-accent transition-colors"
              >
                Nueva Importación
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
