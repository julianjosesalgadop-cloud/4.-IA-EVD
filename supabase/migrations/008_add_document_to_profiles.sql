-- ============================================================
-- ADICIÓN DE COLUMNAS: document_type y document_number en tabla profiles
-- ============================================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS document_type document_type,
ADD COLUMN IF NOT EXISTS document_number VARCHAR(20);

COMMENT ON COLUMN profiles.document_type IS 'Tipo de documento de identificación del usuario';
COMMENT ON COLUMN profiles.document_number IS 'Número de documento de identificación del usuario';
