'use client';

import React, { useState } from 'react';
import { 
  insertIngreso, 
  insertEgreso, 
  getRecentTransactions, 
  deleteTransaction
} from '../lib/queries';
import useSWR from 'swr';
import { RubroPrincipal, SubcategoriaMercancia, MetodoPago } from '../lib/types';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  UserCheck, 
  Home, 
  Activity, 
  Megaphone, 
  Wrench, 
  Plus, 
  Trash2, 
  Calendar, 
  User as UserIcon,
  X,
  AlertTriangle,
  ClipboardList,
  Layers
} from 'lucide-react';

interface ButtonConfig {
  label: string;
  type: 'ingreso' | 'egreso';
  rubro: RubroPrincipal | 'Ingreso Diario';
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}

export default function RegistrationView() {
  const { data: transactionsData, error: transactionsError, mutate: mutateTransactions } = useSWR(
    'recentTransactions',
    getRecentTransactions
  );
  const transactions = transactionsData || [];
  const loadingList = !transactionsData && !transactionsError;
  
  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBtn, setSelectedBtn] = useState<ButtonConfig | null>(null);
  
  // Form states
  const [fecha, setFecha] = useState('');
  const [monto, setMonto] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [subcategoria, setSubcategoria] = useState<SubcategoriaMercancia | ''>('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>(MetodoPago.Efectivo);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmType, setDeleteConfirmType] = useState<'ingreso' | 'egreso' | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const buttonConfigs: ButtonConfig[] = [
    { 
      label: 'Registrar Venta Neta', 
      type: 'ingreso', 
      rubro: 'Ingreso Diario', 
      icon: DollarSign, 
      colorClass: 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_8px_30px_-5px_rgba(16,185,129,0.25)]' 
    },
    { 
      label: 'Mercancía (Variables)', 
      type: 'egreso', 
      rubro: RubroPrincipal.Mercancia, 
      icon: ShoppingBag, 
      colorClass: 'bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-400 border-indigo-500/20 hover:border-indigo-500/40 hover:shadow-[0_8px_30px_-5px_rgba(99,102,241,0.25)]' 
    },
    { 
      label: 'Nómina Operativa', 
      type: 'egreso', 
      rubro: RubroPrincipal.NominaOperativa, 
      icon: Users, 
      colorClass: 'bg-blue-500/10 hover:bg-blue-500/15 text-blue-400 border-blue-500/20 hover:border-blue-500/40 hover:shadow-[0_8px_30px_-5px_rgba(59,130,246,0.25)]' 
    },
    { 
      label: 'Nómina Administrativa', 
      type: 'egreso', 
      rubro: RubroPrincipal.NominaAdministrativa, 
      icon: UserCheck, 
      colorClass: 'bg-cyan-500/10 hover:bg-cyan-500/15 text-cyan-400 border-cyan-500/20 hover:border-cyan-500/40 hover:shadow-[0_8px_30px_-5px_rgba(6,182,212,0.25)]' 
    },
    { 
      label: 'Arriendo', 
      type: 'egreso', 
      rubro: RubroPrincipal.Arriendo, 
      icon: Home, 
      colorClass: 'bg-amber-500/10 hover:bg-amber-500/15 text-amber-400 border-amber-500/20 hover:border-amber-500/40 hover:shadow-[0_8px_30px_-5px_rgba(245,158,11,0.25)]' 
    },
    { 
      label: 'Servicios Públicos', 
      type: 'egreso', 
      rubro: RubroPrincipal.Servicios, 
      icon: Activity, 
      colorClass: 'bg-orange-500/10 hover:bg-orange-500/15 text-orange-400 border-orange-500/20 hover:border-orange-500/40 hover:shadow-[0_8px_30px_-5px_rgba(249,115,22,0.25)]' 
    },
    { 
      label: 'Publicidad', 
      type: 'egreso', 
      rubro: RubroPrincipal.Publicidad, 
      icon: Megaphone, 
      colorClass: 'bg-pink-500/10 hover:bg-pink-500/15 text-pink-400 border-pink-500/20 hover:border-pink-500/40 hover:shadow-[0_8px_30px_-5px_rgba(236,72,153,0.25)]' 
    },
    { 
      label: 'Mantenimiento', 
      type: 'egreso', 
      rubro: RubroPrincipal.Mantenimiento, 
      icon: Wrench, 
      colorClass: 'bg-purple-500/10 hover:bg-purple-500/15 text-purple-400 border-purple-500/20 hover:border-purple-500/40 hover:shadow-[0_8px_30px_-5px_rgba(168,85,247,0.25)]' 
    },
    { 
      label: 'Otros Gastos', 
      type: 'egreso', 
      rubro: RubroPrincipal.Otros, 
      icon: Plus, 
      colorClass: 'bg-slate-500/10 hover:bg-slate-500/15 text-slate-400 border-slate-500/20 hover:border-slate-500/40 hover:shadow-[0_8px_30px_-5px_rgba(100,116,139,0.25)]' 
    }
  ];

  const openFormModal = (btn: ButtonConfig) => {
    const offset = new Date().getTimezoneOffset() * 60000;
    const today = new Date(Date.now() - offset).toISOString().split('T')[0];
    setSelectedBtn(btn);
    setFecha(today);
    setMonto('');
    setProveedor('');
    setSubcategoria(btn.rubro === RubroPrincipal.Mercancia ? SubcategoriaMercancia.Carnes : '');
    setMetodoPago(MetodoPago.Efectivo);
    setFormError('');
    setIsOpen(true);
  };

  const closeFormModal = () => {
    setIsOpen(false);
    setSelectedBtn(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBtn) return;
    
    setSubmitting(true);
    setFormError('');

    const numericMonto = parseFloat(monto);
    if (isNaN(numericMonto) || numericMonto <= 0) {
      setFormError('Por favor ingresa un monto válido mayor a cero.');
      setSubmitting(false);
      return;
    }

    try {
      if (selectedBtn.type === 'ingreso') {
        await insertIngreso(fecha, numericMonto, metodoPago);
      } else {
        const sub = selectedBtn.rubro === RubroPrincipal.Mercancia ? (subcategoria as SubcategoriaMercancia) : null;
        await insertEgreso(fecha, selectedBtn.rubro as RubroPrincipal, sub, proveedor || null, numericMonto);
      }
      closeFormModal();
      mutateTransactions(); // Refresh the express audit list immediately
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar la transacción.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const triggerDelete = (id: string, tipo: 'ingreso' | 'egreso') => {
    setDeleteConfirmId(id);
    setDeleteConfirmType(tipo);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId || !deleteConfirmType) return;
    setDeletingId(deleteConfirmId);

    try {
      await deleteTransaction(deleteConfirmId, deleteConfirmType);
      setDeleteConfirmId(null);
      setDeleteConfirmType(null);
      mutateTransactions(); // Refresh the express audit list
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar la transacción.';
      alert(msg);
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div id="registration-view" className="flex-1 p-4 md:p-8 space-y-8 max-w-4xl mx-auto w-full pb-24 md:pb-8 animate-fade-in">
      {/* Header */}
      <div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider text-indigo-300 shadow-sm mb-3">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Mapeo Operativo Directo</span>
        </span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">Centro de Registro Rápido</h1>
        <p className="text-slate-400 text-sm mt-1">Presiona cualquiera de los botones para capturar datos de manera inmediata</p>
      </div>

      {/* Tactile Grid of Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {buttonConfigs.map((btn, index) => {
          const Icon = btn.icon;
          return (
            <button
              key={index}
              id={`btn-reg-${btn.rubro.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => openFormModal(btn)}
              className={`h-32 rounded-2xl border flex flex-col items-center justify-center p-4 gap-3 text-center backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer active:scale-97 ${btn.colorClass}`}
            >
              <Icon className="w-8 h-8 transition-transform duration-300 group-hover:scale-110" />
              <span className="text-xs font-bold uppercase tracking-wider leading-snug">{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* Express Audit component */}
      <div className="bento-card overflow-hidden shadow-2xl border border-white/[0.03]">
        <div className="p-6 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-2.5">
            <ClipboardList className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-extrabold text-white">Auditoría Express</h2>
          </div>
          <span className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.04] text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            Últimas 5 Transacciones
          </span>
        </div>

        {loadingList ? (
          <div className="p-12 text-center text-slate-500 text-sm font-bold uppercase tracking-wider animate-pulse">
            Sincronizando log de auditoría...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm font-medium">
            No se han registrado transacciones en este periodo todavía.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.02] bg-white/[0.005]">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-5 hover:bg-white/[0.015] transition-all duration-300 relative group">
                {/* Visual Accent bar on hover */}
                <div className={`absolute left-0 top-0 bottom-0 w-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-r-full ${
                  t.tipo === 'ingreso' ? 'bg-emerald-500' : 'bg-indigo-500'
                }`}></div>

                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl border ${
                    t.tipo === 'ingreso' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  }`}>
                    {t.tipo === 'ingreso' ? <DollarSign className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-100 tracking-wide">{t.rubro_principal}</span>
                      {t.subcategoria && (
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] text-indigo-300 font-bold uppercase tracking-wider">
                          {t.subcategoria}
                        </span>
                      )}
                      {t.tipo === 'ingreso' && t.metodo_pago && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-300 font-bold uppercase tracking-wider">
                          {t.metodo_pago}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-bold uppercase tracking-wider">
                      <span>{t.fecha}</span>
                      {t.proveedor && (
                        <>
                          <span className="text-slate-700">&bull;</span>
                          <span className="text-slate-400 font-medium">Prov: {t.proveedor}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <span className={`text-base font-black tracking-tight ${
                    t.tipo === 'ingreso' ? 'text-emerald-400' : 'text-slate-300'
                  }`}>
                    {t.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(t.monto)}
                  </span>
                  
                  <button
                    onClick={() => triggerDelete(t.id, t.tipo)}
                    className="p-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-300 cursor-pointer active:scale-90"
                    title="Eliminar transacción"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Insert Modal Overlay */}
      {isOpen && selectedBtn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02040a]/80 backdrop-blur-md">
          <div className="w-full max-w-md p-8 rounded-3xl glass-panel-glow border border-white/[0.05] relative shadow-2xl animate-scale-in">
            {/* Modal Light Accent */}
            <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
            
            <button 
              onClick={closeFormModal}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.03] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-black text-white tracking-tight mb-1 flex items-center gap-2">
              {selectedBtn.type === 'ingreso' ? 'Registrar Venta' : 'Registrar Costo'}
            </h3>
            <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-6">
              Módulo: {selectedBtn.rubro}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/15 text-red-200 text-xs font-semibold animate-fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Date Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1" htmlFor="date-field">
                  Fecha
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none group-focus-within:text-indigo-400 transition-colors">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    id="date-field"
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full pl-11 pr-3 py-3 rounded-2xl glass-input text-white text-sm"
                  />
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1" htmlFor="monto-field">
                  Monto ($)
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none group-focus-within:text-indigo-400 transition-colors">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <input
                    id="monto-field"
                    type="number"
                    step="0.0001"
                    required
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.0000"
                    className="w-full pl-11 pr-3 py-3 rounded-2xl glass-input text-white text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Subcategoria Select (Only if Mercancia) */}
              {selectedBtn.rubro === RubroPrincipal.Mercancia && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1" htmlFor="subcat-field">
                    Subcategoría Mercancía
                  </label>
                  <select
                    id="subcat-field"
                    value={subcategoria}
                    onChange={(e) => setSubcategoria(e.target.value as SubcategoriaMercancia)}
                    className="w-full px-4 py-3 rounded-2xl glass-input text-white text-sm bg-[#090d1a] border border-white/[0.05] focus:border-indigo-500/50 outline-none"
                  >
                    <option value={SubcategoriaMercancia.Carnes}>{SubcategoriaMercancia.Carnes}</option>
                    <option value={SubcategoriaMercancia.Quesos}>{SubcategoriaMercancia.Quesos}</option>
                    <option value={SubcategoriaMercancia.Legumbres}>{SubcategoriaMercancia.Legumbres}</option>
                    <option value={SubcategoriaMercancia.Bebidas}>{SubcategoriaMercancia.Bebidas}</option>
                    <option value={SubcategoriaMercancia.Aseo}>{SubcategoriaMercancia.Aseo}</option>
                    <option value={SubcategoriaMercancia.Desechables}>{SubcategoriaMercancia.Desechables}</option>
                  </select>
                </div>
              )}

              {/* Proveedor Input (Only for egresos) */}
              {selectedBtn.type === 'egreso' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1" htmlFor="prov-field">
                    Proveedor
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none group-focus-within:text-indigo-400 transition-colors">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      id="prov-field"
                      type="text"
                      value={proveedor}
                      onChange={(e) => setProveedor(e.target.value)}
                      placeholder="Nombre del proveedor o factura"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-white text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Metodo Pago Select (Only for ingreso) */}
              {selectedBtn.type === 'ingreso' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1" htmlFor="metodo-pago-field">
                    Método de Pago
                  </label>
                  <select
                    id="metodo-pago-field"
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                    className="w-full px-4 py-3 rounded-2xl glass-input text-white text-sm bg-[#090d1a] border border-white/[0.05] focus:border-indigo-500/50 outline-none"
                  >
                    <option value={MetodoPago.Efectivo}>Efectivo</option>
                    <option value={MetodoPago.Transferencia}>Transferencia</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 py-4 px-4 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-97 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10"
              >
                {submitting ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <span>Guardar Registro</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02040a]/85 backdrop-blur-md">
          <div className="w-full max-w-sm p-8 rounded-3xl glass-panel border border-red-500/20 text-center shadow-2xl animate-scale-in">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-400 mx-auto mb-4 animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">¿Confirmar Eliminación?</h3>
            <p className="text-slate-400 text-xs mt-3 leading-relaxed font-semibold uppercase tracking-wide">Esta acción es física e irreversible</p>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">El registro se borrará de forma permanente de la base de datos.</p>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => { setDeleteConfirmId(null); setDeleteConfirmType(null); }}
                className="flex-1 py-3 rounded-2xl border border-white/[0.05] text-slate-300 hover:bg-white/[0.02] transition-all text-xs font-bold uppercase tracking-wider cursor-pointer active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingId !== null}
                className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center cursor-pointer active:scale-95 shadow-lg shadow-red-500/15"
              >
                {deletingId ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <span>Eliminar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
