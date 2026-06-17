-- ============================================================
-- ADICIÓN DE COLUMNA: position_id en tabla profiles
-- ============================================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES positions(id) ON DELETE SET NULL;

COMMENT ON COLUMN profiles.position_id IS 'Referencia al cargo de la empresa (positions) asignado al usuario';
