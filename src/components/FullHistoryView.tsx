'use client';

import React, { useState } from 'react';
import { getAllTransactions, deleteTransaction } from '../lib/queries';
import { DollarSign, ShoppingBag, Trash2, ClipboardList } from 'lucide-react';
import useSWR from 'swr';

export default function FullHistoryView() {
  const [limit, setLimit] = useState(50);
  const [filterType, setFilterType] = useState<'todos' | 'ingreso' | 'egreso'>('todos');
  
  const { data: transactions, error, mutate } = useSWR(
    ['allTransactions', limit],
    () => getAllTransactions(limit, 0)
  );

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  const handleDelete = async (id: string, tipo: 'ingreso' | 'egreso') => {
    if (!window.confirm('¿Estás seguro de eliminar esta transacción de forma permanente?')) return;
    
    setDeletingId(id);
    try {
      await deleteTransaction(id, tipo);
      mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTransactions = transactions?.filter(t => {
    if (filterType === 'todos') return true;
    return t.tipo === filterType;
  }) || [];

  return (
    <div className="flex-1 p-4 md:p-8 space-y-8 max-w-5xl mx-auto w-full pb-24 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider text-indigo-300 shadow-sm mb-3">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Auditoría Completa</span>
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">Historial de Registros</h1>
          <p className="text-slate-400 text-sm mt-1">Visualiza y filtra todas las transacciones históricas</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#090d1a] border border-white/[0.05] rounded-xl p-1">
            <button 
              onClick={() => setFilterType('todos')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'todos' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilterType('ingreso')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'ingreso' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Ingresos
            </button>
            <button 
              onClick={() => setFilterType('egreso')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'egreso' ? 'bg-red-500/20 text-red-300' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Egresos
            </button>
          </div>
        </div>
      </div>

      <div className="bento-card overflow-hidden shadow-2xl border border-white/[0.03]">
        {!transactions && !error ? (
          <div className="p-12 text-center text-slate-500 text-sm font-bold uppercase tracking-wider animate-pulse">
            Cargando transacciones...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm font-medium">
            No se encontraron transacciones para estos filtros.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.02] bg-white/[0.005]">
            {filteredTransactions.map((t) => (
              <div key={t.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 hover:bg-white/[0.015] transition-all duration-300 relative group gap-4">
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
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-bold uppercase tracking-wider">
                      <span>{t.fecha}</span>
                      {t.proveedor && (
                        <>
                          <span className="text-slate-700">&bull;</span>
                          <span className="text-slate-400 font-medium">Prov: {t.proveedor}</span>
                        </>
                      )}
                      {t.tipo === 'ingreso' && t.metodo_pago && (
                        <>
                          <span className="text-slate-700">&bull;</span>
                          <span className="text-slate-400 font-medium">{t.metodo_pago}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-5 self-end sm:self-auto">
                  <span className={`text-base font-black tracking-tight ${
                    t.tipo === 'ingreso' ? 'text-emerald-400' : 'text-slate-300'
                  }`}>
                    {t.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(t.monto)}
                  </span>
                  
                  <button
                    onClick={() => handleDelete(t.id, t.tipo)}
                    disabled={deletingId === t.id}
                    className="p-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-300 cursor-pointer disabled:opacity-50"
                  >
                    {deletingId === t.id ? (
                      <span className="w-4 h-4 block border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <Trash2 className="w-4.5 h-4.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {transactions && transactions.length >= limit && (
          <div className="p-4 border-t border-white/[0.04] bg-white/[0.01] flex justify-center">
            <button 
              onClick={() => setLimit(limit + 50)}
              className="px-6 py-2 rounded-xl text-xs font-bold text-indigo-300 hover:text-white hover:bg-indigo-500/20 transition-all border border-indigo-500/20 cursor-pointer"
            >
              Cargar más registros
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
