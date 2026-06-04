-- ============================================================
-- SEED DATA — EVD FLOTA SUGAMUXI S.A.
-- Datos de prueba para desarrollo
-- ============================================================

-- Empresa
INSERT INTO companies (id, name, nit, address, phone, email, city) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Flota Sugamuxi S.A.', '800.123.456-7', 'Calle 15 # 8-32, Sogamoso', '6087430000', 'info@flotasugamuxi.com.co', 'Sogamoso');

-- Roles
INSERT INTO roles (id, name, display_name, description) VALUES
  ('22222222-0000-0000-0000-000000000001', 'admin', 'Administrador', 'Control total del sistema'),
  ('22222222-0000-0000-0000-000000000002', 'rrhh', 'Gestión Humana', 'Administración de evaluaciones y colaboradores'),
  ('22222222-0000-0000-0000-000000000003', 'gerencia', 'Gerencia', 'Consulta estratégica y reportes ejecutivos'),
  ('22222222-0000-0000-0000-000000000004', 'lider', 'Líder / Jefe', 'Evaluación de personal asignado'),
  ('22222222-0000-0000-0000-000000000005', 'colaborador', 'Colaborador', 'Consulta de resultados y PMI propios');

-- Permisos por rol
INSERT INTO permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_export, can_approve) VALUES
  -- Admin: todo
  ('22222222-0000-0000-0000-000000000001', 'colaboradores', true, true, true, true, true, true),
  ('22222222-0000-0000-0000-000000000001', 'evaluaciones', true, true, true, true, true, true),
  ('22222222-0000-0000-0000-000000000001', 'configuracion', true, true, true, true, true, true),
  ('22222222-0000-0000-0000-000000000001', 'pmi', true, true, true, true, true, true),
  ('22222222-0000-0000-0000-000000000001', 'reportes', true, true, true, true, true, true),
  ('22222222-0000-0000-0000-000000000001', 'auditoria', true, false, false, false, true, false),
  ('22222222-0000-0000-0000-000000000001', 'administracion', true, true, true, true, true, true),
  -- RRHH
  ('22222222-0000-0000-0000-000000000002', 'colaboradores', true, true, true, false, true, true),
  ('22222222-0000-0000-0000-000000000002', 'evaluaciones', true, true, true, false, true, true),
  ('22222222-0000-0000-0000-000000000002', 'configuracion', true, true, true, false, true, false),
  ('22222222-0000-0000-0000-000000000002', 'pmi', true, true, true, false, true, true),
  ('22222222-0000-0000-0000-000000000002', 'reportes', true, false, false, false, true, false),
  ('22222222-0000-0000-0000-000000000002', 'auditoria', true, false, false, false, true, false),
  -- Gerencia
  ('22222222-0000-0000-0000-000000000003', 'colaboradores', true, false, false, false, true, false),
  ('22222222-0000-0000-0000-000000000003', 'evaluaciones', true, false, false, false, true, false),
  ('22222222-0000-0000-0000-000000000003', 'pmi', true, false, false, false, true, false),
  ('22222222-0000-0000-0000-000000000003', 'reportes', true, false, false, false, true, false),
  -- Lider
  ('22222222-0000-0000-0000-000000000004', 'colaboradores', true, false, false, false, false, false),
  ('22222222-0000-0000-0000-000000000004', 'evaluaciones', true, true, true, false, false, false),
  ('22222222-0000-0000-0000-000000000004', 'pmi', true, false, false, false, false, false),
  -- Colaborador
  ('22222222-0000-0000-0000-000000000005', 'evaluaciones', true, false, false, false, false, false),
  ('22222222-0000-0000-0000-000000000005', 'pmi', true, false, false, false, false, false);

-- Áreas
INSERT INTO areas (id, company_id, name, code, description) VALUES
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Operaciones', 'OPE', 'Área de operaciones de transporte'),
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Mantenimiento', 'MTO', 'Área de mantenimiento de flota'),
  ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'Gestión Humana', 'RRH', 'Recursos humanos y bienestar'),
  ('33333333-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', 'Comercial', 'COM', 'Área comercial y ventas'),
  ('33333333-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', 'Financiera', 'FIN', 'Área financiera y contable'),
  ('33333333-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000001', 'Tecnología', 'TIC', 'Área de sistemas y tecnología');

-- Cargos
INSERT INTO positions (id, company_id, area_id, name, code, level) VALUES
  ('44444444-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Conductor', 'CON', 1),
  ('44444444-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Despachador', 'DES', 2),
  ('44444444-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Jefe de Operaciones', 'JOP', 3),
  ('44444444-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', 'Mecánico', 'MEC', 1),
  ('44444444-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', 'Jefe de Mantenimiento', 'JMT', 3),
  ('44444444-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000003', 'Analista de RRHH', 'ARH', 2),
  ('44444444-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000003', 'Coordinador de Gestión Humana', 'CGH', 3),
  ('44444444-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000004', 'Asesor Comercial', 'ACO', 2),
  ('44444444-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000005', 'Auxiliar Contable', 'AUX', 1),
  ('44444444-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000005', 'Contador', 'CNT', 2),
  ('44444444-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000001', NULL, 'Gerente General', 'GGE', 5),
  ('44444444-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000001', NULL, 'Subgerente', 'SBG', 4);

-- Versión de evaluación 2026
INSERT INTO evaluation_versions (id, company_id, year, name, description, is_active, is_published, approved_threshold, pmi_threshold) VALUES
  ('55555555-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 2026, 'Evaluación de Desempeño 2026', 'Versión oficial para el año 2026 — 32 preguntas', true, true, 4.0, 3.1);

-- Categorías de evaluación 2026
INSERT INTO evaluation_categories (id, version_id, name, description, sort_order, weight) VALUES
  ('66666666-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', 'Cumplimiento de Funciones y Responsabilidades', 'Evalúa el nivel de cumplimiento de las funciones asignadas al cargo', 1, 25.0),
  ('66666666-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000001', 'Seguridad y Salud en el Trabajo', 'Compromiso con las normas de SST y autocuidado', 2, 20.0),
  ('66666666-0000-0000-0000-000000000003', '55555555-0000-0000-0000-000000000001', 'Seguridad Vial', 'Cumplimiento de normas de seguridad vial y conducción responsable', 3, 20.0),
  ('66666666-0000-0000-0000-000000000004', '55555555-0000-0000-0000-000000000001', 'Calidad y Servicio al Cliente', 'Atención al cliente, imagen personal y calidad del servicio', 4, 15.0),
  ('66666666-0000-0000-0000-000000000005', '55555555-0000-0000-0000-000000000001', 'Trabajo en Equipo y Relaciones Interpersonales', 'Colaboración, comunicación y relaciones con compañeros', 5, 10.0),
  ('66666666-0000-0000-0000-000000000006', '55555555-0000-0000-0000-000000000001', 'Compromiso Organizacional', 'Sentido de pertenencia, puntualidad y valores corporativos', 6, 10.0);

-- Preguntas — Categoría 1: Cumplimiento de Funciones
INSERT INTO evaluation_questions (id, category_id, version_id, code, question, description, sort_order, is_required, is_active, is_critical, min_score_required, weight) VALUES
  ('77777777-0001-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', 'CF-01', 'Cumple con las funciones y tareas asignadas a su cargo de manera oportuna', 'Evalúe el nivel de cumplimiento de responsabilidades', 1, true, true, false, 1.0, 1.0),
  ('77777777-0001-0000-0000-000000000002', '66666666-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', 'CF-02', 'Demuestra conocimiento técnico suficiente para el desempeño de su cargo', 'Conocimientos, habilidades y competencias técnicas', 2, true, true, false, 1.0, 1.0),
  ('77777777-0001-0000-0000-000000000003', '66666666-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', 'CF-03', 'Organiza y prioriza adecuadamente sus actividades para alcanzar los objetivos', 'Planificación y organización del trabajo', 3, true, true, false, 1.0, 1.0),
  ('77777777-0001-0000-0000-000000000004', '66666666-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', 'CF-04', 'Reporta novedades, incidentes y situaciones relevantes de manera oportuna', 'Comunicación de novedades a superiores', 4, true, true, false, 1.0, 1.0),
  ('77777777-0001-0000-0000-000000000005', '66666666-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', 'CF-05', 'Mantiene en buen estado y cuida los recursos físicos y equipos de trabajo', 'Cuidado de bienes de la empresa', 5, true, true, false, 1.0, 1.0);

-- Preguntas — Categoría 2: SST (críticas)
INSERT INTO evaluation_questions (id, category_id, version_id, code, question, description, sort_order, is_required, is_active, is_critical, min_score_required, weight) VALUES
  ('77777777-0002-0000-0000-000000000001', '66666666-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000001', 'SST-01', 'Usa adecuada y permanentemente los elementos de protección personal (EPP)', 'Uso correcto de EPP según funciones', 1, true, true, true, 3.0, 1.5),
  ('77777777-0002-0000-0000-000000000002', '66666666-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000001', 'SST-02', 'Cumple con los procedimientos y protocolos de seguridad definidos', 'Adherencia a protocolos de seguridad', 2, true, true, true, 3.0, 1.5),
  ('77777777-0002-0000-0000-000000000003', '66666666-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000001', 'SST-03', 'Reporta condiciones y actos inseguros de manera oportuna', 'Cultura de reporte de riesgos', 3, true, true, false, 1.0, 1.0),
  ('77777777-0002-0000-0000-000000000004', '66666666-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000001', 'SST-04', 'Participa activamente en las actividades de SST y capacitaciones requeridas', 'Participación en programas de SST', 4, true, true, false, 1.0, 1.0),
  ('77777777-0002-0000-0000-000000000005', '66666666-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000001', 'SST-05', 'Mantiene su área de trabajo limpia y ordenada (5S)', 'Orden y aseo en el puesto de trabajo', 5, true, true, false, 1.0, 1.0);

-- Preguntas — Categoría 3: Seguridad Vial (críticas)
INSERT INTO evaluation_questions (id, category_id, version_id, code, question, description, sort_order, is_required, is_active, is_critical, min_score_required, weight) VALUES
  ('77777777-0003-0000-0000-000000000001', '66666666-0000-0000-0000-000000000003', '55555555-0000-0000-0000-000000000001', 'SV-01', 'Cumple con las normas de tránsito y conducción defensiva en todo momento', 'Adherencia a normas de tránsito', 1, true, true, true, 4.0, 2.0),
  ('77777777-0003-0000-0000-000000000002', '66666666-0000-0000-0000-000000000003', '55555555-0000-0000-0000-000000000001', 'SV-02', 'Verifica el estado del vehículo antes de iniciar operaciones (pre-trip)', 'Inspección pre-operacional del vehículo', 2, true, true, true, 3.0, 1.5),
  ('77777777-0003-0000-0000-000000000003', '66666666-0000-0000-0000-000000000003', '55555555-0000-0000-0000-000000000001', 'SV-03', 'No utiliza dispositivos móviles durante la conducción', 'Distracción al volante', 3, true, true, true, 4.0, 2.0),
  ('77777777-0003-0000-0000-000000000004', '66666666-0000-0000-0000-000000000003', '55555555-0000-0000-0000-000000000001', 'SV-04', 'Respeta los límites de velocidad y conduce de manera defensiva', 'Velocidad y conducción defensiva', 4, true, true, true, 3.0, 1.5),
  ('77777777-0003-0000-0000-000000000005', '66666666-0000-0000-0000-000000000003', '55555555-0000-0000-0000-000000000001', 'SV-05', 'Reporta accidentes, incidentes y casi-accidentes de manera inmediata', 'Reporte oportuno de eventos viales', 5, true, true, false, 1.0, 1.0),
  ('77777777-0003-0000-0000-000000000006', '66666666-0000-0000-0000-000000000003', '55555555-0000-0000-0000-000000000001', 'SV-06', 'Cumple con los descansos reglamentarios y no conduce en estado de fatiga', 'Gestión de la fatiga', 6, true, true, true, 3.0, 1.5);

-- Preguntas — Categoría 4: Calidad y Servicio
INSERT INTO evaluation_questions (id, category_id, version_id, code, question, description, sort_order, is_required, is_active, is_critical, min_score_required, weight) VALUES
  ('77777777-0004-0000-0000-000000000001', '66666666-0000-0000-0000-000000000004', '55555555-0000-0000-0000-000000000001', 'CS-01', 'Brinda un trato amable, respetuoso y cordial a los pasajeros/clientes', 'Atención y servicio al cliente', 1, true, true, false, 1.0, 1.0),
  ('77777777-0004-0000-0000-000000000002', '66666666-0000-0000-0000-000000000004', '55555555-0000-0000-0000-000000000001', 'CS-02', 'Mantiene una presentación personal adecuada (uniforme, higiene)', 'Imagen personal y presentación', 2, true, true, false, 1.0, 1.0),
  ('77777777-0004-0000-0000-000000000003', '66666666-0000-0000-0000-000000000004', '55555555-0000-0000-0000-000000000001', 'CS-03', 'Maneja adecuadamente las quejas y reclamos de los clientes', 'Gestión de PQR', 3, true, true, false, 1.0, 1.0),
  ('77777777-0004-0000-0000-000000000004', '66666666-0000-0000-0000-000000000004', '55555555-0000-0000-0000-000000000001', 'CS-04', 'Cumple con los tiempos de servicio y rutas establecidas', 'Puntualidad y cumplimiento de rutas', 4, true, true, false, 1.0, 1.0);

-- Preguntas — Categoría 5: Trabajo en Equipo
INSERT INTO evaluation_questions (id, category_id, version_id, code, question, description, sort_order, is_required, is_active, is_critical, min_score_required, weight) VALUES
  ('77777777-0005-0000-0000-000000000001', '66666666-0000-0000-0000-000000000005', '55555555-0000-0000-0000-000000000001', 'TE-01', 'Colabora con sus compañeros y apoya al equipo cuando es necesario', 'Colaboración y trabajo en equipo', 1, true, true, false, 1.0, 1.0),
  ('77777777-0005-0000-0000-000000000002', '66666666-0000-0000-0000-000000000005', '55555555-0000-0000-0000-000000000001', 'TE-02', 'Se comunica de manera asertiva y respetuosa con compañeros y superiores', 'Comunicación asertiva', 2, true, true, false, 1.0, 1.0),
  ('77777777-0005-0000-0000-000000000003', '66666666-0000-0000-0000-000000000005', '55555555-0000-0000-0000-000000000001', 'TE-03', 'Maneja adecuadamente los conflictos sin generar situaciones de tensión', 'Manejo de conflictos', 3, true, true, false, 1.0, 1.0),
  ('77777777-0005-0000-0000-000000000004', '66666666-0000-0000-0000-000000000005', '55555555-0000-0000-0000-000000000001', 'TE-04', 'Acepta retroalimentación y trabaja para mejorar continuamente', 'Receptividad al feedback', 4, true, true, false, 1.0, 1.0);

-- Preguntas — Categoría 6: Compromiso
INSERT INTO evaluation_questions (id, category_id, version_id, code, question, description, sort_order, is_required, is_active, is_critical, min_score_required, weight) VALUES
  ('77777777-0006-0000-0000-000000000001', '66666666-0000-0000-0000-000000000006', '55555555-0000-0000-0000-000000000001', 'CO-01', 'Cumple puntualmente con su horario de trabajo y responsabilidades', 'Puntualidad y asistencia', 1, true, true, false, 1.0, 1.0),
  ('77777777-0006-0000-0000-000000000002', '66666666-0000-0000-0000-000000000006', '55555555-0000-0000-0000-000000000001', 'CO-02', 'Demuestra sentido de pertenencia y orgullo por la empresa', 'Identidad corporativa', 2, true, true, false, 1.0, 1.0),
  ('77777777-0006-0000-0000-000000000003', '66666666-0000-0000-0000-000000000006', '55555555-0000-0000-0000-000000000001', 'CO-03', 'Actúa con honestidad, ética e integridad en todas sus actuaciones', 'Ética y valores', 3, true, true, false, 1.0, 1.0),
  ('77777777-0006-0000-0000-000000000004', '66666666-0000-0000-0000-000000000006', '55555555-0000-0000-0000-000000000001', 'CO-04', 'Muestra disposición para aprender y adaptarse a los cambios organizacionales', 'Adaptabilidad y aprendizaje continuo', 4, true, true, false, 1.0, 1.0),
  ('77777777-0006-0000-0000-000000000005', '66666666-0000-0000-0000-000000000006', '55555555-0000-0000-0000-000000000001', 'CO-05', 'Cuida la imagen e intereses de la empresa en todo momento', 'Cuidado de la imagen corporativa', 5, true, true, false, 1.0, 1.0),
  ('77777777-0006-0000-0000-000000000006', '66666666-0000-0000-0000-000000000006', '55555555-0000-0000-0000-000000000001', 'CO-06', 'Participa proactivamente en las actividades de bienestar y eventos corporativos', 'Participación en cultura organizacional', 6, true, true, false, 1.0, 1.0);

-- Reglas de criterios críticos
INSERT INTO critical_rules (id, version_id, question_id, name, description, min_score_required, action) VALUES
  ('88888888-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', '77777777-0002-0000-0000-000000000001', 'EPP Obligatorio', 'El uso de EPP es obligatorio. Nota mínima 3 (Cumple lo esperado)', 3.0, 'generar_pmi'),
  ('88888888-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000001', '77777777-0002-0000-0000-000000000002', 'Protocolos de Seguridad', 'Cumplimiento de protocolos SST. Nota mínima 3', 3.0, 'generar_pmi'),
  ('88888888-0000-0000-0000-000000000003', '55555555-0000-0000-0000-000000000001', '77777777-0003-0000-0000-000000000001', 'Normas de Tránsito - Crítico', 'El incumplimiento de normas de tránsito es crítico. Nota mínima 4', 4.0, 'generar_pmi'),
  ('88888888-0000-0000-0000-000000000004', '55555555-0000-0000-0000-000000000001', '77777777-0003-0000-0000-000000000003', 'No Uso de Celular - Crítico', 'Uso de celular en conducción es causal de sanción. Nota mínima 4', 4.0, 'generar_pmi');
