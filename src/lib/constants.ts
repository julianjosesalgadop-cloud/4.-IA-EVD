export const DEFAULT_FIELDS = [
  { id: "document_type", label: "Tipo de Documento", field_type: "select", is_required: true, is_visible: true, step_number: 1, is_system: true },
  { id: "document_number", label: "Número de Documento", field_type: "text", is_required: true, is_visible: true, step_number: 1, is_system: true },
  { id: "first_name", label: "Nombres", field_type: "text", is_required: true, is_visible: true, step_number: 1, is_system: true },
  { id: "last_name", label: "Apellidos", field_type: "text", is_required: true, is_visible: true, step_number: 1, is_system: true },
  { id: "email", label: "Correo Electrónico", field_type: "email", is_required: false, is_visible: true, step_number: 1, is_system: false },
  { id: "phone", label: "Celular", field_type: "text", is_required: false, is_visible: true, step_number: 1, is_system: false },
  { id: "gender", label: "Género", field_type: "select", is_required: false, is_visible: true, step_number: 1, is_system: false },
  { id: "area_id", label: "Área", field_type: "select", is_required: true, is_visible: true, step_number: 2, is_system: false },
  { id: "position_id", label: "Cargo", field_type: "select", is_required: true, is_visible: true, step_number: 2, is_system: false },
  { id: "status", label: "Estado", field_type: "select", is_required: false, is_visible: true, step_number: 2, is_system: false },
  { id: "workplace_city", label: "Sede / Ciudad", field_type: "text", is_required: false, is_visible: true, step_number: 2, is_system: false },
  { id: "hire_date", label: "Fecha de Ingreso", field_type: "date", is_required: false, is_visible: true, step_number: 2, is_system: false },
  { id: "immediate_boss_id", label: "Jefe Inmediato", field_type: "select", is_required: false, is_visible: true, step_number: 3, is_system: false },
];

export const PAYROLL_TYPES = [
  "COMISIÓN 1-2-3-4",
  "PLANTA (SOGAMOSO)",
  "AUXILIARES DE VENTA",
  "ADMÓN SERVICIO ESPECIAL",
  "ADMINISTRATIVOS",
  "VEREDAL",
  "URBANO SOGAMOSO",
  "PLANTA CASANARE",
  "OPERATIVOS",
  "GERENCIA",
  "URBANO YOPAL",
  "APRENDICES SENA"
];

