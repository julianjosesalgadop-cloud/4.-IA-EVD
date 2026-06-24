-- ============================================================
-- ADICIÓN DE COLUMNA AUTOINCREMENTAL: code en tabla evaluations
-- Formato: EVD-FS-AÑO-####
-- ============================================================

-- 1. Crear secuencia para el número autoincremental
CREATE SEQUENCE IF NOT EXISTS evaluation_code_seq;

-- 2. Adicionar la columna code en la tabla evaluations si no existe
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS code VARCHAR(50) UNIQUE;

-- 3. Función y trigger para autogenerar el código antes de insertar registros
CREATE OR REPLACE FUNCTION generate_evaluation_code()
RETURNS TRIGGER AS $$
DECLARE
  next_val INT;
  year_val INT;
BEGIN
  -- Si el código ya viene especificado, lo respetamos
  IF NEW.code IS NOT NULL AND NEW.code <> '' THEN
    RETURN NEW;
  END IF;

  -- Obtener el siguiente valor de la secuencia
  next_val := nextval('evaluation_code_seq');
  
  -- Obtener el año (de la evaluación o del sistema actual)
  year_val := COALESCE(NEW.evaluation_year, EXTRACT(YEAR FROM NOW())::INT);
  
  -- Formatear como: EVD-FS-AÑO-#### (con ceros a la izquierda hasta completar 4 dígitos)
  NEW.code := 'EVD-FS-' || year_val || '-' || LPAD(next_val::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger BEFORE INSERT
CREATE OR REPLACE TRIGGER set_evaluation_code
  BEFORE INSERT ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION generate_evaluation_code();

-- 4. Script para poblar las evaluaciones existentes de forma consecutiva
DO $$
DECLARE
  r RECORD;
  c INT := 1;
BEGIN
  FOR r IN (
    SELECT id, evaluation_year 
    FROM evaluations 
    ORDER BY created_at ASC
  ) LOOP
    UPDATE evaluations 
    SET code = 'EVD-FS-' || COALESCE(r.evaluation_year, 2026) || '-' || LPAD(c::TEXT, 4, '0')
    WHERE id = r.id;
    c := c + 1;
  END LOOP;
  -- Ajustar la secuencia para empezar desde el consecutivo actual
  EXECUTE 'ALTER SEQUENCE evaluation_code_seq RESTART WITH ' || c;
END $$;

COMMENT ON COLUMN evaluations.code IS 'Código consecutivo de evaluación formateado como EVD-FS-AÑO-####';
