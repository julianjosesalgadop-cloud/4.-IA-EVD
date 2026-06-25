-- ============================================================
-- RESET DE CONSECUTIVO DE EVALUACIONES
-- Reinicia la secuencia de códigos de evaluaciones a 1
-- ============================================================

ALTER SEQUENCE IF EXISTS evaluation_code_seq RESTART WITH 1;
