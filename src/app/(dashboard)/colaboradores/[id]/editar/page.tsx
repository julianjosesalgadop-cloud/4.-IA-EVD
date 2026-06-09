"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getCollaboratorById, updateCollaborator } from "@/app/actions/collaborators";
import { getAreas, getPositions } from "@/app/actions/config";
import { getCollaborators } from "@/app/actions/collaborators";
import { formatDate, getStatusLabel } from "@/lib/utils";

const statusOptions = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
  { value: "retirado", label: "Retirado" },
  { value: "vacaciones", label: "Vacaciones" },
  { value: "incapacidad", label: "Incapacidad" },
];

const contractTypes = [
  { value: "indefinido", label: "Término Indefinido" },
  { value: "fijo", label: "Término Fijo" },
  { value: "obra_labor", label: "Obra o Labor" },
  { value: "aprendizaje", label: "Aprendizaje" },
  { value: "prestacion_servicios", label: "Prestación de Servicios" },
  { value: "temporal", label: "Temporal" },
];

export default function CollaboratorEditPage() {
  const params = useParams();
  const router = useRouter();
  const collaboratorId = params?.id as string;
  const [collaborator, setCollaborator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [areas, setAreas] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    birth_date: "",
    gender: "",
    internal_code: "",
    area_id: "",
    position_id: "",
    workplace_city: "",
    workplace: "",
    contract_type: "",
    hire_date: "",
    status: "activo",
    immediate_boss_id: "",
    area_leader_id: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [collabData, areasData, positionsData, collabsData] = await Promise.all([
          getCollaboratorById(collaboratorId),
          getAreas(),
          getPositions(),
          getCollaborators(),
        ]);

        if (collabData.error) {
          setError(collabData.error);
          toast.error("No se pudo cargar el colaborador.");
        } else {
          setCollaborator(collabData.data);
          const c = collabData.data;
          setForm({
            first_name: c.first_name || "",
            last_name: c.last_name || "",
            email: c.email || "",
            phone: c.phone || "",
            address: c.address || "",
            city: c.city || "",
            birth_date: c.birth_date || "",
            gender: c.gender || "",
            internal_code: c.internal_code || "",
            area_id: c.area_id || "",
            position_id: c.position_id || "",
            workplace_city: c.workplace_city || "",
            workplace: c.workplace || "",
            contract_type: c.contract_type || "",
            hire_date: c.hire_date || "",
            status: c.status || "activo",
            immediate_boss_id: c.immediate_boss_id || "",
            area_leader_id: c.area_leader_id || "",
          });
        }

        setAreas(areasData || []);
        setPositions(positionsData || []);
        setCollaborators(collabsData?.data || []);
      } catch (err) {
        console.error("Error loading data", err);
        setError("Error cargando datos");
      } finally {
        setLoading(false);
      }
    }

    if (collaboratorId) loadData();
  }, [collaboratorId]);

  const handleChange = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!collaboratorId) return;
    setSaving(true);

    const updatePayload = {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      city: form.city || null,
      birth_date: form.birth_date || null,
      gender: form.gender || null,
      internal_code: form.internal_code || null,
      area_id: form.area_id || null,
      position_id: form.position_id || null,
      workplace_city: form.workplace_city || null,
      workplace: form.workplace || null,
      contract_type: form.contract_type || null,
      hire_date: form.hire_date || null,
      status: form.status,
      immediate_boss_id: form.immediate_boss_id || null,
      area_leader_id: form.area_leader_id || null,
    };

    const res = await updateCollaborator(collaboratorId, updatePayload);
    setSaving(false);

    if (res.error) {
      toast.error("Error al guardar: " + res.error);
      return;
    }

    toast.success("Colaborador actualizado correctamente.");
    router.push(`/colaboradores/${collaboratorId}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href={`/colaboradores/${collaboratorId || ""}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver a detalles
          </Link>
          <h1 className="text-2xl font-bold mt-4">Editar Colaborador</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          Estado: <span className="font-semibold">{collaborator ? getStatusLabel(collaborator.status) : "—"}</span>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">Cargando colaborador...</div>
      ) : error ? (
        <div className="rounded-xl border bg-card p-8 text-center text-danger-600">{error}</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">Información Personal</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombres *</label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  required
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Apellidos *</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  required
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Correo</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Dirección</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ciudad</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={form.birth_date}
                  onChange={(e) => handleChange("birth_date", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Género</label>
                <select
                  value={form.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                >
                  <option value="">Seleccionar...</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                  <option value="no_informa">No informa</option>
                </select>
              </div>
            </div>
          </div>

          {/* Información Laboral */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">Información Laboral</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Código Interno</label>
                <input
                  type="text"
                  value={form.internal_code}
                  onChange={(e) => handleChange("internal_code", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado *</label>
                <select
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Área *</label>
                <select
                  value={form.area_id}
                  onChange={(e) => handleChange("area_id", e.target.value)}
                  required
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                >
                  <option value="">Seleccionar área...</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cargo *</label>
                <select
                  value={form.position_id}
                  onChange={(e) => handleChange("position_id", e.target.value)}
                  required
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                >
                  <option value="">Seleccionar cargo...</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Contrato</label>
                <select
                  value={form.contract_type}
                  onChange={(e) => handleChange("contract_type", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                >
                  <option value="">Seleccionar...</option>
                  {contractTypes.map((ct) => (
                    <option key={ct.value} value={ct.value}>
                      {ct.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha de Ingreso *</label>
                <input
                  type="date"
                  value={form.hire_date}
                  onChange={(e) => handleChange("hire_date", e.target.value)}
                  required
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ciudad de Trabajo</label>
                <input
                  type="text"
                  value={form.workplace_city}
                  onChange={(e) => handleChange("workplace_city", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sede / Lugar de Trabajo</label>
                <input
                  type="text"
                  value={form.workplace}
                  onChange={(e) => handleChange("workplace", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                />
              </div>
            </div>
          </div>

          {/* Jerarquía */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">Estructura Jerárquica</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Jefe Inmediato</label>
                <select
                  value={form.immediate_boss_id}
                  onChange={(e) => handleChange("immediate_boss_id", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                >
                  <option value="">Seleccionar...</option>
                  {collaborators.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Líder de Área</label>
                <select
                  value={form.area_leader_id}
                  onChange={(e) => handleChange("area_leader_id", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                >
                  <option value="">Seleccionar...</option>
                  {collaborators.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-xl border bg-card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Cambios guardados automáticamente</p>
                <p className="text-sm text-muted-foreground">Los cambios se guardarán cuando hagas clic en Guardar.</p>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" /> Guardar cambios
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
