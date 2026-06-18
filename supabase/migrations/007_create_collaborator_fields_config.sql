-- TABLA: collaborator_fields_config
CREATE TABLE IF NOT EXISTS collaborator_fields_config (
  id VARCHAR(50) PRIMARY KEY, -- Identificador único del campo (ej. email, phone, workplace_city)
  label VARCHAR(100) NOT NULL, -- Etiqueta / Nombre visible en el formulario
  field_type VARCHAR(20) NOT NULL, -- Tipo de campo: 'text', 'select', 'date', 'email'
  is_required BOOLEAN NOT NULL DEFAULT false, -- Si es obligatorio
  is_visible BOOLEAN NOT NULL DEFAULT true, -- Si se muestra en el formulario
  step_number INTEGER NOT NULL DEFAULT 1, -- Paso del wizard (1, 2, 3)
  is_system BOOLEAN NOT NULL DEFAULT false, -- Campos obligatorios por BD (documento, nombres) que no se pueden desactivar
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar seguridad RLS
ALTER TABLE collaborator_fields_config ENABLE ROW LEVEL SECURITY;

-- Crear políticas para leer y escribir para usuarios autenticados
CREATE POLICY "Permitir lectura de campos a todos los autenticados"
  ON collaborator_fields_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir modificación de campos a administradores"
  ON collaborator_fields_config FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Poblar con los campos por defecto del sistema
INSERT INTO collaborator_fields_config (id, label, field_type, is_required, is_visible, step_number, is_system) VALUES
('document_type', 'Tipo de Documento', 'select', true, true, 1, true),
('document_number', 'Número de Documento', 'text', true, true, 1, true),
('first_name', 'Nombres', 'text', true, true, 1, true),
('last_name', 'Apellidos', 'text', true, true, 1, true),
('email', 'Correo Electrónico', 'email', false, true, 1, false),
('phone', 'Celular', 'text', false, true, 1, false),
('gender', 'Género', 'select', false, true, 1, false),
('area_id', 'Área', 'select', true, true, 2, false),
('position_id', 'Cargo', 'select', true, true, 2, false),
('status', 'Estado', 'select', false, true, 2, false),
('workplace_city', 'Sede / Ciudad', 'text', false, true, 2, false),
('hire_date', 'Fecha de Ingreso', 'date', false, true, 2, false),
('immediate_boss_id', 'Jefe Inmediato', 'select', false, true, 3, false)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  field_type = EXCLUDED.field_type,
  is_required = EXCLUDED.is_required,
  is_visible = EXCLUDED.is_visible,
  step_number = EXCLUDED.step_number,
  is_system = EXCLUDED.is_system;
