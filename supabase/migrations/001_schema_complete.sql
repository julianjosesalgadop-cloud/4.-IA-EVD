-- ============================================================
-- EVD FLOTA SUGAMUXI S.A. — SCHEMA COMPLETO
-- Plataforma de Evaluaciones de Desempeño
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'rrhh', 'gerencia', 'lider', 'colaborador');
CREATE TYPE contract_type AS ENUM ('indefinido', 'fijo', 'obra_labor', 'aprendizaje', 'prestacion_servicios', 'temporal');
CREATE TYPE evaluation_status AS ENUM ('borrador', 'en_proceso', 'finalizada', 'reabierta', 'anulada');
CREATE TYPE evaluation_result AS ENUM ('aprobado', 'plan_mejoramiento', 'no_aprobado', 'pendiente');
CREATE TYPE pmi_status AS ENUM ('activo', 'en_seguimiento', 'cerrado', 'vencido');
CREATE TYPE followup_status AS ENUM ('pendiente', 'completado', 'vencido');
CREATE TYPE notification_type AS ENUM ('evaluacion_creada', 'evaluacion_pendiente', 'evaluacion_finalizada', 'pmi_generado', 'seguimiento_vencido', 'colaborador_nuevo', 'correo_fallido', 'sistema');
CREATE TYPE audit_action AS ENUM ('crear', 'editar', 'eliminar', 'finalizar', 'reabrir', 'correo_enviado', 'descarga_pdf', 'descarga_excel', 'cambio_configuracion', 'login', 'logout');
CREATE TYPE document_type AS ENUM ('CC', 'CE', 'TI', 'PP', 'NIT', 'RUT');
CREATE TYPE gender_type AS ENUM ('masculino', 'femenino', 'otro', 'no_informa');
CREATE TYPE collaborator_status AS ENUM ('activo', 'inactivo', 'retirado', 'vacaciones', 'incapacidad');
CREATE TYPE email_status AS ENUM ('enviado', 'fallido', 'pendiente', 'bounced');

-- ============================================================
-- TABLA: companies (Multi-empresa)
-- ============================================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  nit VARCHAR(20) UNIQUE,
  logo_url TEXT,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Colombia',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- ============================================================
-- TABLA: roles
-- ============================================================
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name user_role NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- ============================================================
-- TABLA: permissions
-- ============================================================
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  module VARCHAR(50) NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  can_approve BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(role_id, module)
);

-- ============================================================
-- TABLA: profiles (extends auth.users de Supabase)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  role_id UUID REFERENCES roles(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  collaborator_id UUID, -- link to collaborators table if applicable
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- ============================================================
-- TABLA: areas
-- ============================================================
CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(20),
  description TEXT,
  manager_id UUID, -- references profiles
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- ============================================================
-- TABLA: processes
-- ============================================================
CREATE TABLE processes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(20),
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- ============================================================
-- TABLA: positions (Cargos)
-- ============================================================
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  area_id UUID REFERENCES areas(id),
  process_id UUID REFERENCES processes(id),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(20),
  level INTEGER DEFAULT 1, -- jerarquía
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- ============================================================
-- TABLA: cost_centers
-- ============================================================
CREATE TABLE cost_centers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(20) UNIQUE,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- ============================================================
-- TABLA: collaborators
-- ============================================================
CREATE TABLE collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Información Personal
  document_type document_type NOT NULL,
  document_number VARCHAR(20) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  full_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  birth_date DATE,
  gender gender_type,
  
  -- Información Laboral
  internal_code VARCHAR(20) UNIQUE,
  area_id UUID REFERENCES areas(id),
  process_id UUID REFERENCES processes(id),
  position_id UUID REFERENCES positions(id),
  cost_center_id UUID REFERENCES cost_centers(id),
  workplace_city VARCHAR(100),
  workplace VARCHAR(100),
  contract_type contract_type,
  hire_date DATE,
  termination_date DATE,
  status collaborator_status DEFAULT 'activo',
  
  -- Jerarquía
  immediate_boss_id UUID REFERENCES collaborators(id),
  area_leader_id UUID REFERENCES collaborators(id),
  responsible_manager_id UUID REFERENCES profiles(id),
  
  -- Foto
  photo_url TEXT,
  
  -- Metadatos
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  
  UNIQUE(company_id, document_number)
);

-- ============================================================
-- TABLA: evaluation_versions (Versionamiento por año)
-- ============================================================
CREATE TABLE evaluation_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  questions_count INTEGER DEFAULT 0,
  scale_min NUMERIC(3,1) DEFAULT 1.0,
  scale_max NUMERIC(3,1) DEFAULT 5.0,
  approved_threshold NUMERIC(3,1) DEFAULT 4.0,
  pmi_threshold NUMERIC(3,1) DEFAULT 3.1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  UNIQUE(company_id, year)
);

-- ============================================================
-- TABLA: evaluation_categories
-- ============================================================
CREATE TABLE evaluation_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_id UUID NOT NULL REFERENCES evaluation_versions(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  weight NUMERIC(5,2) DEFAULT 100, -- peso porcentual
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- ============================================================
-- TABLA: evaluation_questions
-- ============================================================
CREATE TABLE evaluation_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES evaluation_categories(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES evaluation_versions(id) ON DELETE CASCADE,
  code VARCHAR(20),
  question TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  is_critical BOOLEAN DEFAULT false,
  min_score_required NUMERIC(3,1) DEFAULT 1.0, -- para criterios críticos
  weight NUMERIC(5,2) DEFAULT 1.0, -- peso en cálculo
  applies_to_positions UUID[], -- array de position_ids (null = todos)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- ============================================================
-- TABLA: critical_rules (Configuración criterios críticos)
-- ============================================================
CREATE TABLE critical_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_id UUID NOT NULL REFERENCES evaluation_versions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES evaluation_questions(id),
  category_id UUID REFERENCES evaluation_categories(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  min_score_required NUMERIC(3,1) NOT NULL DEFAULT 3.0,
  action TEXT DEFAULT 'generar_pmi', -- acción al incumplir
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- ============================================================
-- TABLA: evaluations (Cabecera de evaluación)
-- ============================================================
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES evaluation_versions(id),
  
  -- Partes
  evaluatee_id UUID NOT NULL REFERENCES collaborators(id),
  evaluator_id UUID NOT NULL REFERENCES profiles(id),
  evaluator_position VARCHAR(200),
  evaluator_area VARCHAR(200),
  
  -- Datos de evaluación
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  evaluation_year INTEGER NOT NULL,
  evaluation_type VARCHAR(50) DEFAULT '90', -- 90, 180, 270, 360, auto
  
  -- Narrativa
  observations TEXT,
  strengths TEXT,
  improvement_opportunities TEXT,
  training_needs TEXT,
  
  -- Estado
  status evaluation_status DEFAULT 'borrador',
  draft_data JSONB, -- auto-guardado del borrador
  
  -- Metadatos
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES profiles(id),
  reopened_at TIMESTAMPTZ,
  reopened_by UUID REFERENCES profiles(id),
  reopen_reason TEXT,
  
  -- Firmas digitales
  evaluator_signed_at TIMESTAMPTZ,
  evaluatee_signed_at TIMESTAMPTZ,
  evaluatee_accepted BOOLEAN DEFAULT false,
  
  -- Archivos
  pdf_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- ============================================================
-- TABLA: evaluation_answers
-- ============================================================
CREATE TABLE evaluation_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES evaluation_questions(id),
  category_id UUID NOT NULL REFERENCES evaluation_categories(id),
  score NUMERIC(3,1) NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  is_critical_fail BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  UNIQUE(evaluation_id, question_id)
);

-- ============================================================
-- TABLA: evaluation_results (Resultados calculados)
-- ============================================================
CREATE TABLE evaluation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID NOT NULL UNIQUE REFERENCES evaluations(id) ON DELETE CASCADE,
  
  -- Promedio general
  overall_average NUMERIC(4,2) NOT NULL,
  result evaluation_result NOT NULL,
  
  -- Promedios por categoría (JSONB: {category_id: {name, average, score}})
  category_scores JSONB,
  
  -- Criterios críticos
  has_critical_fails BOOLEAN DEFAULT false,
  critical_fails_detail JSONB, -- array de {question, score, min_required}
  
  -- PMI automático
  pmi_required BOOLEAN DEFAULT false,
  pmi_reason TEXT,
  
  -- Distribución de scores
  score_distribution JSONB, -- {1: count, 2: count, 3: count, 4: count, 5: count}
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- ============================================================
-- TABLA: improvement_plans (PMI)
-- ============================================================
CREATE TABLE improvement_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES collaborators(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  
  reason TEXT NOT NULL,
  actions TEXT NOT NULL,
  responsible_id UUID REFERENCES profiles(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status pmi_status DEFAULT 'activo',
  
  -- Reevaluación final
  final_evaluation_id UUID REFERENCES evaluations(id),
  final_result TEXT,
  final_score NUMERIC(4,2),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES profiles(id),
  closure_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- ============================================================
-- TABLA: improvement_followups (Seguimientos PMI)
-- ============================================================
CREATE TABLE improvement_followups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pmi_id UUID NOT NULL REFERENCES improvement_plans(id) ON DELETE CASCADE,
  followup_number INTEGER NOT NULL CHECK (followup_number IN (30, 60, 90)),
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  status followup_status DEFAULT 'pendiente',
  responsible_id UUID REFERENCES profiles(id),
  observations TEXT,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  UNIQUE(pmi_id, followup_number)
);

-- ============================================================
-- TABLA: feedback_sessions (Retroalimentación)
-- ============================================================
CREATE TABLE feedback_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES profiles(id),
  evaluatee_id UUID NOT NULL REFERENCES collaborators(id),
  
  session_date DATE NOT NULL,
  comments TEXT,
  agreements TEXT,
  commitments TEXT,
  observations TEXT,
  
  -- Aceptación digital
  evaluatee_accepted BOOLEAN DEFAULT false,
  evaluatee_accepted_at TIMESTAMPTZ,
  evaluatee_signature_ip VARCHAR(45),
  evaluatee_comments TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- ============================================================
-- TABLA: training_recommendations
-- ============================================================
CREATE TABLE training_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES collaborators(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  
  topic VARCHAR(300) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'media', -- alta, media, baja
  type VARCHAR(50), -- interno, externo, virtual, presencial
  provider VARCHAR(200),
  estimated_hours INTEGER,
  estimated_cost NUMERIC(12,2),
  status VARCHAR(20) DEFAULT 'pendiente', -- pendiente, en_proceso, completado, cancelado
  completion_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- ============================================================
-- TABLA: notifications
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  type notification_type NOT NULL,
  title VARCHAR(300) NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  related_id UUID, -- ID del recurso relacionado
  related_type VARCHAR(50), -- 'evaluation', 'pmi', 'collaborator', etc.
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: email_logs
-- ============================================================
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  evaluation_id UUID REFERENCES evaluations(id),
  pmi_id UUID REFERENCES improvement_plans(id),
  
  template VARCHAR(100) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(200),
  subject VARCHAR(500) NOT NULL,
  status email_status DEFAULT 'pendiente',
  
  -- Resend
  resend_id VARCHAR(100),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  
  -- Adjuntos
  has_pdf BOOLEAN DEFAULT false,
  pdf_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: audit_logs
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES profiles(id),
  action audit_action NOT NULL,
  
  -- Recurso afectado
  table_name VARCHAR(100),
  record_id UUID,
  
  -- Cambios
  old_values JSONB,
  new_values JSONB,
  
  -- Contexto
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  device VARCHAR(200),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

-- collaborators
CREATE INDEX idx_collaborators_company ON collaborators(company_id);
CREATE INDEX idx_collaborators_area ON collaborators(area_id);
CREATE INDEX idx_collaborators_position ON collaborators(position_id);
CREATE INDEX idx_collaborators_status ON collaborators(status);
CREATE INDEX idx_collaborators_document ON collaborators(document_number);
CREATE INDEX idx_collaborators_fullname ON collaborators USING gin(full_name gin_trgm_ops);

-- evaluations
CREATE INDEX idx_evaluations_company ON evaluations(company_id);
CREATE INDEX idx_evaluations_evaluatee ON evaluations(evaluatee_id);
CREATE INDEX idx_evaluations_evaluator ON evaluations(evaluator_id);
CREATE INDEX idx_evaluations_status ON evaluations(status);
CREATE INDEX idx_evaluations_year ON evaluations(evaluation_year);
CREATE INDEX idx_evaluations_version ON evaluations(version_id);

-- answers
CREATE INDEX idx_answers_evaluation ON evaluation_answers(evaluation_id);
CREATE INDEX idx_answers_question ON evaluation_answers(question_id);

-- PMI
CREATE INDEX idx_pmi_collaborator ON improvement_plans(collaborator_id);
CREATE INDEX idx_pmi_status ON improvement_plans(status);
CREATE INDEX idx_pmi_evaluation ON improvement_plans(evaluation_id);

-- notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- audit
CREATE INDEX idx_audit_company ON audit_logs(company_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_table ON audit_logs(table_name);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================

-- Trigger: updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'companies', 'roles', 'permissions', 'profiles', 'areas', 'processes',
    'positions', 'cost_centers', 'collaborators', 'evaluation_versions',
    'evaluation_categories', 'evaluation_questions', 'critical_rules',
    'evaluations', 'evaluation_answers', 'evaluation_results',
    'improvement_plans', 'improvement_followups', 'feedback_sessions',
    'training_recommendations', 'email_logs'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t
    );
  END LOOP;
END;
$$;

-- Función: calcular resultado de evaluación
CREATE OR REPLACE FUNCTION calculate_evaluation_result(p_evaluation_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_overall_avg NUMERIC(4,2);
  v_result_status evaluation_result;
  v_category_scores JSONB := '{}';
  v_critical_fails JSONB := '[]';
  v_has_critical_fails BOOLEAN := false;
  v_pmi_required BOOLEAN := false;
  v_pmi_reason TEXT := '';
  v_version_id UUID;
  v_approved_threshold NUMERIC(3,1);
  v_pmi_threshold NUMERIC(3,1);
BEGIN
  -- Obtener version y umbrales
  SELECT ev.id, ev.approved_threshold, ev.pmi_threshold
  INTO v_version_id, v_approved_threshold, v_pmi_threshold
  FROM evaluations e
  JOIN evaluation_versions ev ON e.version_id = ev.id
  WHERE e.id = p_evaluation_id;

  -- Calcular promedio general ponderado
  SELECT ROUND(
    SUM(ea.score * COALESCE(eq.weight, 1.0)) / NULLIF(SUM(COALESCE(eq.weight, 1.0)), 0),
    2
  )
  INTO v_overall_avg
  FROM evaluation_answers ea
  JOIN evaluation_questions eq ON ea.question_id = eq.id
  WHERE ea.evaluation_id = p_evaluation_id;

  -- Calcular promedios por categoría
  SELECT jsonb_object_agg(cat_id, cat_data)
  INTO v_category_scores
  FROM (
    SELECT
      ec.id::TEXT AS cat_id,
      jsonb_build_object(
        'name', ec.name,
        'average', ROUND(AVG(ea.score), 2),
        'count', COUNT(*)
      ) AS cat_data
    FROM evaluation_answers ea
    JOIN evaluation_questions eq ON ea.question_id = eq.id
    JOIN evaluation_categories ec ON eq.category_id = ec.id
    WHERE ea.evaluation_id = p_evaluation_id
    GROUP BY ec.id, ec.name
  ) cats;

  -- Detectar incumplimientos críticos
  SELECT jsonb_agg(fail_data)
  INTO v_critical_fails
  FROM (
    SELECT jsonb_build_object(
      'question_id', eq.id,
      'question', eq.question,
      'score', ea.score,
      'min_required', eq.min_score_required
    ) AS fail_data
    FROM evaluation_answers ea
    JOIN evaluation_questions eq ON ea.question_id = eq.id
    WHERE ea.evaluation_id = p_evaluation_id
      AND eq.is_critical = true
      AND ea.score < eq.min_score_required
  ) fails;

  v_has_critical_fails := (v_critical_fails IS NOT NULL AND jsonb_array_length(COALESCE(v_critical_fails, '[]')) > 0);

  -- Determinar resultado
  IF v_overall_avg >= v_approved_threshold THEN
    v_result_status := 'aprobado';
    v_pmi_required := false;
  ELSIF v_overall_avg >= v_pmi_threshold THEN
    v_result_status := 'plan_mejoramiento';
    v_pmi_required := true;
    v_pmi_reason := 'Promedio general entre 3.1 y 3.9';
  ELSE
    v_result_status := 'no_aprobado';
    v_pmi_required := true;
    v_pmi_reason := 'Promedio general inferior a 3.1';
  END IF;

  -- Criterios críticos generan PMI aunque el promedio sea aprobado
  IF v_has_critical_fails THEN
    v_pmi_required := true;
    IF v_result_status = 'aprobado' THEN
      v_pmi_reason := 'Incumplimiento de criterio(s) crítico(s)';
    ELSE
      v_pmi_reason := v_pmi_reason || '. Además: incumplimiento de criterio(s) crítico(s)';
    END IF;
  END IF;

  -- Insertar o actualizar resultado
  INSERT INTO evaluation_results (
    evaluation_id, overall_average, result, category_scores,
    has_critical_fails, critical_fails_detail, pmi_required, pmi_reason,
    calculated_at
  ) VALUES (
    p_evaluation_id, v_overall_avg, v_result_status, v_category_scores,
    v_has_critical_fails, COALESCE(v_critical_fails, '[]'),
    v_pmi_required, v_pmi_reason, NOW()
  )
  ON CONFLICT (evaluation_id) DO UPDATE SET
    overall_average = EXCLUDED.overall_average,
    result = EXCLUDED.result,
    category_scores = EXCLUDED.category_scores,
    has_critical_fails = EXCLUDED.has_critical_fails,
    critical_fails_detail = EXCLUDED.critical_fails_detail,
    pmi_required = EXCLUDED.pmi_required,
    pmi_reason = EXCLUDED.pmi_reason,
    calculated_at = EXCLUDED.calculated_at;

  -- Marcar respuestas críticas fallidas
  UPDATE evaluation_answers ea
  SET is_critical_fail = true
  FROM evaluation_questions eq
  WHERE ea.question_id = eq.id
    AND ea.evaluation_id = p_evaluation_id
    AND eq.is_critical = true
    AND ea.score < eq.min_score_required;

  RETURN jsonb_build_object(
    'overall_average', v_overall_avg,
    'result', v_result_status,
    'pmi_required', v_pmi_required,
    'has_critical_fails', v_has_critical_fails
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: auto-crear seguimientos PMI
CREATE OR REPLACE FUNCTION create_pmi_followups(p_pmi_id UUID)
RETURNS void AS $$
DECLARE
  v_start_date DATE;
BEGIN
  SELECT start_date INTO v_start_date FROM improvement_plans WHERE id = p_pmi_id;
  
  INSERT INTO improvement_followups (pmi_id, followup_number, scheduled_date)
  VALUES
    (p_pmi_id, 30, v_start_date + INTERVAL '30 days'),
    (p_pmi_id, 60, v_start_date + INTERVAL '60 days'),
    (p_pmi_id, 90, v_start_date + INTERVAL '90 days')
  ON CONFLICT (pmi_id, followup_number) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: crear seguimientos al crear PMI
CREATE OR REPLACE FUNCTION trigger_create_pmi_followups()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_pmi_followups(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_pmi_insert
  AFTER INSERT ON improvement_plans
  FOR EACH ROW EXECUTE FUNCTION trigger_create_pmi_followups();

-- Función: actualizar contador de preguntas en versión
CREATE OR REPLACE FUNCTION update_version_question_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE evaluation_versions
  SET questions_count = (
    SELECT COUNT(*) FROM evaluation_questions
    WHERE version_id = COALESCE(NEW.version_id, OLD.version_id)
    AND is_active = true
  )
  WHERE id = COALESCE(NEW.version_id, OLD.version_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_question_count
  AFTER INSERT OR UPDATE OR DELETE ON evaluation_questions
  FOR EACH ROW EXECUTE FUNCTION update_version_question_count();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE critical_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: obtener company_id del usuario actual
CREATE OR REPLACE FUNCTION auth_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function: obtener rol del usuario actual
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT AS $$
  SELECT r.name::TEXT FROM profiles p JOIN roles r ON p.role_id = r.id WHERE p.id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function: es admin o rrhh
CREATE OR REPLACE FUNCTION is_admin_or_rrhh()
RETURNS BOOLEAN AS $$
  SELECT auth_user_role() IN ('admin', 'rrhh')
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Políticas: companies (solo ver la propia)
CREATE POLICY "users_view_own_company" ON companies
  FOR SELECT USING (id = auth_company_id());

CREATE POLICY "admin_manage_company" ON companies
  FOR ALL USING (id = auth_company_id() AND is_admin_or_rrhh());

-- Políticas: profiles
CREATE POLICY "users_view_company_profiles" ON profiles
  FOR SELECT USING (company_id = auth_company_id());

CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "admin_manage_profiles" ON profiles
  FOR ALL USING (company_id = auth_company_id() AND is_admin_or_rrhh());

-- Políticas: collaborators
CREATE POLICY "view_company_collaborators" ON collaborators
  FOR SELECT USING (company_id = auth_company_id());

CREATE POLICY "admin_rrhh_manage_collaborators" ON collaborators
  FOR ALL USING (company_id = auth_company_id() AND is_admin_or_rrhh());

-- Políticas: evaluations
CREATE POLICY "view_company_evaluations" ON evaluations
  FOR SELECT USING (company_id = auth_company_id());

CREATE POLICY "evaluator_create_evaluation" ON evaluations
  FOR INSERT WITH CHECK (company_id = auth_company_id());

CREATE POLICY "evaluator_update_own_draft" ON evaluations
  FOR UPDATE USING (
    company_id = auth_company_id() AND
    (evaluator_id = auth.uid() OR is_admin_or_rrhh())
  );

-- Políticas: evaluation_answers, results
CREATE POLICY "view_company_answers" ON evaluation_answers
  FOR SELECT USING (
    evaluation_id IN (SELECT id FROM evaluations WHERE company_id = auth_company_id())
  );

CREATE POLICY "evaluator_manage_answers" ON evaluation_answers
  FOR ALL USING (
    evaluation_id IN (
      SELECT id FROM evaluations WHERE company_id = auth_company_id()
      AND (evaluator_id = auth.uid() OR is_admin_or_rrhh())
    )
  );

-- Políticas: notifications (solo propias)
CREATE POLICY "users_view_own_notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users_update_own_notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Políticas: PMI
CREATE POLICY "view_company_pmi" ON improvement_plans
  FOR SELECT USING (company_id = auth_company_id());

CREATE POLICY "admin_rrhh_manage_pmi" ON improvement_plans
  FOR ALL USING (company_id = auth_company_id() AND is_admin_or_rrhh());

-- Políticas: audit_logs (solo admins pueden ver)
CREATE POLICY "admin_view_audit" ON audit_logs
  FOR SELECT USING (
    company_id = auth_company_id() AND auth_user_role() IN ('admin', 'rrhh', 'gerencia')
  );

-- Políticas genéricas para tablas de configuración (misma empresa)
CREATE POLICY "view_company_areas" ON areas FOR SELECT USING (company_id = auth_company_id());
CREATE POLICY "admin_manage_areas" ON areas FOR ALL USING (company_id = auth_company_id() AND is_admin_or_rrhh());

CREATE POLICY "view_company_processes" ON processes FOR SELECT USING (
  area_id IN (SELECT id FROM areas WHERE company_id = auth_company_id())
);
CREATE POLICY "view_company_positions" ON positions FOR SELECT USING (company_id = auth_company_id());
CREATE POLICY "admin_manage_positions" ON positions FOR ALL USING (company_id = auth_company_id() AND is_admin_or_rrhh());
CREATE POLICY "view_company_cost_centers" ON cost_centers FOR SELECT USING (company_id = auth_company_id());

CREATE POLICY "view_eval_versions" ON evaluation_versions FOR SELECT USING (company_id = auth_company_id());
CREATE POLICY "admin_manage_eval_versions" ON evaluation_versions FOR ALL USING (company_id = auth_company_id() AND is_admin_or_rrhh());

CREATE POLICY "view_eval_categories" ON evaluation_categories FOR SELECT USING (
  version_id IN (SELECT id FROM evaluation_versions WHERE company_id = auth_company_id())
);
CREATE POLICY "view_eval_questions" ON evaluation_questions FOR SELECT USING (
  version_id IN (SELECT id FROM evaluation_versions WHERE company_id = auth_company_id())
);
CREATE POLICY "admin_manage_questions" ON evaluation_questions FOR ALL USING (
  version_id IN (SELECT id FROM evaluation_versions WHERE company_id = auth_company_id())
  AND is_admin_or_rrhh()
);

CREATE POLICY "view_eval_results" ON evaluation_results FOR SELECT USING (
  evaluation_id IN (SELECT id FROM evaluations WHERE company_id = auth_company_id())
);
CREATE POLICY "view_pmi_followups" ON improvement_followups FOR SELECT USING (
  pmi_id IN (SELECT id FROM improvement_plans WHERE company_id = auth_company_id())
);
CREATE POLICY "view_feedback" ON feedback_sessions FOR SELECT USING (
  evaluation_id IN (SELECT id FROM evaluations WHERE company_id = auth_company_id())
);
CREATE POLICY "view_training" ON training_recommendations FOR SELECT USING (company_id = auth_company_id());
CREATE POLICY "view_email_logs" ON email_logs FOR SELECT USING (company_id = auth_company_id());
CREATE POLICY "view_critical_rules" ON critical_rules FOR SELECT USING (
  version_id IN (SELECT id FROM evaluation_versions WHERE company_id = auth_company_id())
);
