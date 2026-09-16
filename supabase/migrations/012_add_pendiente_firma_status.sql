-- =============================================
-- Migración 012: Agregar estado 'pendiente_firma'
-- =============================================
-- Agrega el valor 'pendiente_firma' al enum evaluation_status
-- para soportar el flujo donde el líder completa la evaluación
-- pero el colaborador aún no ha firmado.

ALTER TYPE evaluation_status ADD VALUE IF NOT EXISTS 'pendiente_firma' AFTER 'en_proceso';
