'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PlusCircle, Edit3, UserX, AlertTriangle } from 'lucide-react';
import { getActiveEmployees, createEmployee, deactivateEmployee } from '@/lib/queries-nomina';
import type { Employee } from '@/lib/types/nomina';

// ─── Tipos del formulario (Hallazgo #7: sin `any`) ───────────────────────────
interface EmployeeFormData {
  first_name: string;
  last_name: string;
  hourly_rate: number;
  minute_rate: number;
}

const EMPTY_FORM: EmployeeFormData = {
  first_name: '',
  last_name: '',
  hourly_rate: 0,
  minute_rate: 0,
};

// ─── Modal via Portal (Hallazgo #9: mounted simplificado) ────────────────────
function EmployeeModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  handleHourlyRateChange,
  handleMinuteRateChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  formData: EmployeeFormData;
  setFormData: React.Dispatch<React.SetStateAction<EmployeeFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  handleHourlyRateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMinuteRateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  // Hallazgo #9: guarda SSR simplificada
  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-[#090d1f] border border-white/[0.12] rounded-3xl shadow-[0_8px_80px_rgba(0,0,0,0.8)] w-full max-w-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glows */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-[60px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-white/[0.06] relative z-10">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Agregar Empleado</h3>
            <p className="text-xs text-slate-500 mt-0.5">Completa los datos del nuevo integrante del equipo.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors border border-white/[0.08] text-sm font-bold"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="relative z-10">
          <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Izquierda — Información personal */}
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest border-b border-white/[0.06] pb-2">
                Información Personal
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombres</label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full bg-[#02040a] border border-white/[0.1] text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all placeholder:text-slate-600"
                  value={formData.first_name}
                  onChange={(e) => setFormData((p) => ({ ...p, first_name: e.target.value }))}
                  placeholder="Ej. Juan"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Apellidos</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#02040a] border border-white/[0.1] text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all placeholder:text-slate-600"
                  value={formData.last_name}
                  onChange={(e) => setFormData((p) => ({ ...p, last_name: e.target.value }))}
                  placeholder="Ej. Pérez"
                />
              </div>
            </div>

            {/* Derecha — Configuración salarial */}
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest border-b border-white/[0.06] pb-2">
                Configuración Salarial (COP)
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Valor por Hora</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm select-none">$</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="100"
                    className="w-full bg-[#02040a] border border-white/[0.1] text-emerald-400 font-mono font-bold px-8 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                    value={formData.hourly_rate}
                    onChange={handleHourlyRateChange}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Valor por Minuto</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm select-none">$</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="w-full bg-[#02040a] border border-white/[0.1] text-slate-300 font-mono px-8 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                    value={formData.minute_rate}
                    onChange={handleMinuteRateChange}
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-600 uppercase tracking-wide text-center pt-1">
                ↔ Vinculados matemáticamente
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-8 pb-7 pt-2 relative z-10 border-t border-white/[0.04]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-transparent border border-white/[0.1] text-slate-300 rounded-xl hover:bg-white/[0.05] font-semibold text-sm transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 font-bold text-sm shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Guardar Empleado
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function EmployeeManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>(EMPTY_FORM);

  const loadEmployees = async () => {
    try {
      setError(null);
      const data = await getActiveEmployees();
      setEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando empleados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleHourlyRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hourly = Number(e.target.value);
    setFormData((p) => ({ ...p, hourly_rate: hourly, minute_rate: Number((hourly / 60).toFixed(2)) }));
  };

  const handleMinuteRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const minute = Number(e.target.value);
    setFormData((p) => ({ ...p, minute_rate: minute, hourly_rate: Math.round(minute * 60) }));
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await createEmployee(formData.first_name, formData.last_name, formData.hourly_rate);
      setIsModalOpen(false);
      setFormData(EMPTY_FORM);
      await loadEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando empleado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`¿Desactivar a ${name}? Podrá reactivarse desde la base de datos.`)) return;
    try {
      await deactivateEmployee(id);
      await loadEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desactivando empleado');
    }
  };

  return (
    <>
      <div className="bg-[#090d1f]/40 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Error banner (Hallazgo #12) */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4 text-sm text-red-400 flex items-start gap-3 relative z-10">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
            <p>{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-400 text-lg leading-none">✕</button>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Personal Activo</h2>
            <p className="text-sm text-slate-400 mt-1">Configura perfiles y tarifas por hora/minuto.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Nuevo Empleado</span>
          </button>
        </div>

        <div className="overflow-x-auto relative z-10">
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Cargando empleados...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-slate-500 italic">No hay empleados activos. Crea el primero.</p>
            </div>
          ) : (
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="px-4 py-4 text-xs font-bold text-indigo-300 uppercase tracking-widest">Empleado</th>
                  <th className="px-4 py-4 text-xs font-bold text-indigo-300 uppercase tracking-widest">Tarifa / Hora</th>
                  <th className="px-4 py-4 text-xs font-bold text-indigo-300 uppercase tracking-widest">Tarifa / Min</th>
                  <th className="px-4 py-4 text-xs font-bold text-indigo-300 uppercase tracking-widest">Estado</th>
                  <th className="px-4 py-4 text-xs font-bold text-indigo-300 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-5 whitespace-nowrap">
                      <div className="font-semibold text-slate-200">{emp.first_name} {emp.last_name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">ID: {emp.id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap">
                      <span className="text-emerald-400 font-mono font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        ${emp.hourly_rate.toLocaleString('es-CO')}
                      </span>
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap">
                      <span className="text-slate-400 font-mono text-sm">
                        ${(emp.hourly_rate / 60).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-full border bg-indigo-500/10 text-indigo-300 border-indigo-500/30">
                        Activo
                      </span>
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-3">
                        <button className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors" title="Editar">
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeactivate(emp.id, `${emp.first_name} ${emp.last_name}`)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Desactivar"
                        >
                          <UserX className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setFormData(EMPTY_FORM); }}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleAddEmployee}
        isSubmitting={isSubmitting}
        handleHourlyRateChange={handleHourlyRateChange}
        handleMinuteRateChange={handleMinuteRateChange}
      />
    </>
  );
}
