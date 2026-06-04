'use client';

import React from 'react';
import { BarChart3, PlusCircle, History, LogOut, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

import { UserRole } from '../lib/types';

interface NavbarProps {
  activeTab: 'dashboard' | 'registro' | 'historial';
  setActiveTab: (tab: 'dashboard' | 'registro' | 'historial') => void;
  userEmail: string;
  userRole: UserRole;
}

export default function Navbar({ activeTab, setActiveTab, userEmail, userRole }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
      await supabase.auth.signOut();
      router.push('/login');
    }
  };

  const navItems = [
    { id: 'dashboard' as const, label: 'P&G Real-Time', icon: BarChart3, roles: ['admin'] },
    { id: 'registro' as const, label: 'Registro Rápido', icon: PlusCircle, roles: ['admin', 'empleado'] },
    { id: 'historial' as const, label: 'Histórico & Comparativo', icon: History, roles: ['admin'] },
  ].filter(item => !userRole || item.roles.includes(userRole));

  return (
    <>
      {/* Desktop Sidebar (visible on md and up) */}
      <aside className="hidden md:flex flex-col w-72 bg-[#090d1f]/40 backdrop-blur-2xl border-r border-white/[0.04] p-6 min-h-screen justify-between sticky top-0 z-40">
        <div>
          {/* Logo / Header */}
          <div className="mb-10 px-2">
            <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-indigo-200 to-pink-300 bg-clip-text text-transparent tracking-tight">
              CASA BISTRO
            </h2>
            <p className="text-slate-500 text-[10px] mt-1.5 uppercase tracking-[0.2em] font-extrabold">
              Sistema Analítico
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 relative group cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/12 to-violet-500/4 border border-indigo-500/25 text-indigo-300 font-semibold shadow-[0_4px_20px_-3px_rgba(99,102,241,0.1)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] border border-transparent'
                  }`}
                >
                  {/* Left accent indicator line */}
                  {isActive && (
                    <div className="absolute left-0 top-1/3 bottom-1/3 w-1.5 rounded-r-full bg-gradient-to-b from-indigo-400 to-pink-400"></div>
                  )}
                  <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span className="text-sm tracking-wide">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="border-t border-white/[0.04] pt-6 space-y-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.01] border border-white/[0.02]">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
              <User className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {userRole === 'admin' ? 'ADMINISTRADOR' : userRole === 'empleado' ? 'EMPLEADO' : 'USUARIO'}
              </p>
              <p className="text-sm text-slate-300 truncate font-medium mt-0.5" title={userEmail}>
                {userEmail}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            id="btn-logout-desktop"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-red-500/10 text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-300 text-sm font-semibold cursor-pointer active:scale-97"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation (visible below md) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#030614]/85 backdrop-blur-2xl border-t border-white/[0.04] px-4 py-3 flex items-center justify-around shadow-[0_-10px_35px_rgba(0,0,0,0.8)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-link-mobile-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-xl transition-all duration-300 cursor-pointer ${
                isActive ? 'text-indigo-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="text-[9px] font-semibold uppercase tracking-wider">{item.label.split(' ')[0]}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-400 to-pink-400 absolute -bottom-0.5 shadow-[0_0_8px_rgba(99,102,241,1)]"></span>
              )}
            </button>
          );
        })}
        <button
          onClick={handleLogout}
          id="btn-logout-mobile"
          className="flex flex-col items-center gap-1.5 py-1 px-3 text-red-500 cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[9px] font-semibold uppercase tracking-wider">Salir</span>
        </button>
      </div>
    </>
  );
}
