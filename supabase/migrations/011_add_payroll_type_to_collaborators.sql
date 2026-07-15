-- ============================================================
-- ADICIÓN DE COLUMNA: payroll_type en tabla collaborators
-- ============================================================

ALTER TABLE collaborators 
ADD COLUMN IF NOT EXISTS payroll_type VARCHAR(100);

COMMENT ON COLUMN collaborators.payroll_type IS 'Tipo de nómina asignado al colaborador (e.g. COMISIÓN 1-2-3-4, PLANTA (SOGAMOSO), etc.)';
