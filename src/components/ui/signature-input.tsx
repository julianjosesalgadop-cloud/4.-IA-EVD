"use client";

import React, { useRef, useState, useEffect } from "react";
import { Trash2, Upload, Paintbrush, Check, X, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignatureInputProps {
  value: string | null; // Base64 data URL
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
}

export function SignatureInput({ value, onChange, placeholder = "Firme aquí", className }: SignatureInputProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<"draw" | "upload">("draw");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Initialize canvas drawing settings with ResizeObserver to prevent coordinate scaling offset inside dynamic/animated layouts
  useEffect(() => {
    if (activeTab !== "draw" || value || !canvasRef.current) return;
    const canvas = canvasRef.current;
    
    let lastWidth = 0;
    let lastHeight = 0;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      if (rect.width === lastWidth && rect.height === lastHeight) return;

      lastWidth = rect.width;
      lastHeight = rect.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Adjust canvas for high DPI screens
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      // Canvas styles
      ctx.strokeStyle = document.documentElement.classList.contains("dark") ? "#f8fafc" : "#0f172a";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Clear canvas
      ctx.clearRect(0, 0, rect.width, rect.height);
      setHasDrawn(false);
    };

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        resizeCanvas();
      });
    });

    resizeObserver.observe(canvas);
    resizeCanvas();

    return () => {
      resizeObserver.disconnect();
    };
  }, [activeTab, value]);

  // Drawing event handlers
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onChange(null);
  };

  const saveCanvasSignature = () => {
    if (!canvasRef.current || !hasDrawn) return;
    const base64 = canvasRef.current.toDataURL("image/png");
    onChange(base64);
  };

  // File Uploader Handlers
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, suba únicamente archivos de imagen (PNG, JPG)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const img = new Image();
        img.src = e.target.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            onChange(e.target?.result as string);
            return;
          }

          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 150;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressed = canvas.toDataURL("image/png");
          onChange(compressed);
        };
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {value ? (
        // Preview State
        <div className="border border-dashed border-success-300 dark:border-success-800 rounded-xl bg-success-50/10 dark:bg-success-950/5 p-4 flex flex-col items-center justify-center relative min-h-[160px] animate-fade-in group">
          <img
            src={value}
            alt="Firma registrada"
            className="max-h-28 max-w-full object-contain dark:invert"
          />
          <div className="absolute top-2 right-2 flex gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onChange(null)}
              className="p-1.5 rounded-lg bg-danger-500 hover:bg-danger-600 text-white shadow-md transition-colors"
              title="Eliminar firma"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <span className="inline-flex items-center gap-1 mt-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-100 dark:bg-success-900/40 text-success-800 dark:text-success-300 border border-success-200 dark:border-success-800/50">
            <Check className="w-3 h-3" /> Firma cargada
          </span>
        </div>
      ) : (
        // Input Tabs State
        <div className="border rounded-xl bg-background overflow-hidden shadow-sm">
          {/* Tabs */}
          <div className="flex border-b bg-muted/20 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("draw")}
              className={cn(
                "flex-1 py-2.5 font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors",
                activeTab === "draw"
                  ? "border-primary text-primary bg-background"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              Dibujar Firma
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={cn(
                "flex-1 py-2.5 font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors",
                activeTab === "upload"
                  ? "border-primary text-primary bg-background"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Upload className="w-3.5 h-3.5" />
              Subir Imagen
            </button>
          </div>

          {/* Active Tab View */}
          <div className="p-4">
            {activeTab === "draw" ? (
              <div className="space-y-3">
                <div className="relative border rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-900/20">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-36 bg-transparent block cursor-crosshair touch-none"
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/40 text-xs">
                      {placeholder}
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={clearCanvas}
                    disabled={!hasDrawn}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border hover:bg-muted text-muted-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpiar
                  </button>
                  <button
                    type="button"
                    onClick={saveCanvasSignature}
                    disabled={!hasDrawn}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg gradient-brand text-white font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Confirmar Firma
                  </button>
                </div>
              </div>
            ) : (
              // Upload Tab
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors min-h-[144px]",
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/20 hover:border-primary/50 bg-zinc-50/50 dark:bg-zinc-900/10"
                )}
              >
                <input
                  type="file"
                  id="sig-file-input"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <label
                  htmlFor="sig-file-input"
                  className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-full h-full"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground/70">
                    <FileImage className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Arrastre la imagen de su firma o haga clic aquí
                    </p>
                    <p className="text-[10px] text-muted-foreground/80 mt-1">
                      Formatos recomendados: PNG (con fondo transparente), JPG
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
