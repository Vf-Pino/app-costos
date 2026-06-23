'use client';

import React, { useState } from 'react';
import EmployeeManager from '@/components/nomina/EmployeeManager';
import TimeLogger from '@/components/nomina/TimeLogger';
import PayrollLiquidation from '@/components/nomina/PayrollLiquidation';

export default function NominaView() {
  const [activeTab, setActiveTab] = useState<'employees' | 'time' | 'payroll'>('time');

  return (
    <div className="flex-1 w-full bg-transparent p-4 sm:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-400 via-violet-300 to-pink-300 bg-clip-text text-transparent tracking-tight mb-2">
            Módulo de Nómina y Personal
          </h1>
          <p className="text-slate-400 font-medium tracking-wide">
            Gestiona a tus empleados, registra sus horas y liquida la quincena.
          </p>
        </div>

        {/* Premium Tabs */}
        <div className="mb-8 p-1.5 bg-[#090d1f]/60 backdrop-blur-md rounded-2xl border border-white/[0.05] flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 w-full sm:w-max">
          <button
            onClick={() => setActiveTab('time')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === 'time'
                ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)] border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] border border-transparent'
            }`}
          >
            Registro de Tiempos
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === 'employees'
                ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)] border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] border border-transparent'
            }`}
          >
            Gestión de Empleados
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === 'payroll'
                ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)] border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] border border-transparent'
            }`}
          >
            Liquidación Quincenal
          </button>
        </div>

        {/* Tab Content with fade-in animation */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'time' && <TimeLogger />}
          {activeTab === 'employees' && <EmployeeManager />}
          {activeTab === 'payroll' && <PayrollLiquidation />}
        </div>
      </div>
    </div>
  );
}
