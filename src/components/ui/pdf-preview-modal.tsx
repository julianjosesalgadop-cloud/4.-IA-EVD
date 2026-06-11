"use client";

import React, { useEffect, useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBlob: Blob | null;
  fileName: string;
}

export function PdfPreviewModal({ isOpen, onClose, pdfBlob, fileName }: PdfPreviewModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (pdfBlob && isOpen) {
      setIsLoading(true);
      const url = URL.createObjectURL(pdfBlob);
      setBlobUrl(url);
      
      // Give a tiny timeout for iframe to load or display loader
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 600);
      
      return () => {
        clearTimeout(timer);
        URL.revokeObjectURL(url);
        setBlobUrl(null);
      };
    }
  }, [pdfBlob, isOpen]);

  const handleDownload = () => {
    if (!pdfBlob) return;
    const url = blobUrl || URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (!blobUrl) {
      URL.revokeObjectURL(url);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative flex flex-col w-full max-w-5xl h-[85vh] sm:h-[90vh] rounded-2xl border bg-card text-foreground shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
            <div className="flex flex-col min-w-0 pr-4">
              <span className="text-sm font-semibold text-foreground truncate">
                Previsualización de PDF Corporativo
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {fileName}
              </span>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-brand text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar</span>
              </button>
              
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content / PDF viewer */}
          <div className="flex-1 bg-muted/10 relative">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/80 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                <p className="text-sm text-muted-foreground font-medium">Cargando visualización del documento...</p>
              </div>
            )}
            
            {blobUrl ? (
              <iframe
                src={blobUrl}
                className="w-full h-full border-none"
                title="PDF Preview"
                onLoad={() => setIsLoading(false)}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">No se pudo generar la previsualización.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
