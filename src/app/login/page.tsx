'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { LogIn, Lock, Mail, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  // Check if already authenticated, then redirect
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/');
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message === 'Invalid login credentials' 
          ? 'Credenciales incorrectas. Verifica tu correo y contraseña.' 
          : error.message
        );
      } else if (data?.session) {
        router.push('/');
      }
    } catch (err: unknown) {
      setErrorMsg('Ocurrió un error inesperado al iniciar sesión.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="login-page" className="flex-1 flex items-center justify-center p-4 relative min-h-screen bg-[#02040a] overflow-hidden select-none">
      {/* Background glowing circles - high blur, rich visual aesthetics */}
      <div className="absolute top-[10%] left-[10%] w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[380px] h-[380px] bg-pink-500/8 rounded-full blur-[130px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[110px] pointer-events-none"></div>

      <div className="w-full max-w-md p-10 rounded-3xl glass-panel-glow border border-white/[0.05] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9),_0_0_50px_rgba(99,102,241,0.03)] relative z-10 animate-scale-in">
        {/* Decorative inner light band */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/35 to-transparent"></div>

        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/5 border border-indigo-500/20 mb-5 shadow-lg animate-pulse-ring">
            <LogIn className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent tracking-tight">
            Casa Bistro
          </h1>
          <p className="text-slate-400 mt-2.5 text-xs font-semibold uppercase tracking-[0.15em]">
            Costos & P&G Analítico
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/15 text-red-200 text-xs font-medium animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="email-input">
              Correo Electrónico
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors duration-250">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@casabistro.com"
                className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-white text-sm"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="password-input">
              Contraseña
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors duration-250">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-white text-sm"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-pink-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-pink-500 transition-all duration-300 shadow-[0_8px_30px_rgba(99,102,241,0.2)] hover:shadow-[0_12px_45px_rgba(99,102,241,0.35)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-97 select-none"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <span>Ingresar al Sistema</span>
            )}
          </button>
        </form>

        <div className="text-center mt-8 text-[10px] text-slate-600 font-bold uppercase tracking-[0.1em]">
          Casa Bistro &copy; {new Date().getFullYear()} &bull; Módulo Analítico Síncrono
        </div>
      </div>
    </main>
  );
}
