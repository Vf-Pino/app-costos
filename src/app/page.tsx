'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import Navbar from '../components/Navbar';
import DashboardView from '../components/DashboardView';
import RegistrationView from '../components/RegistrationView';
import HistoryView from '../components/HistoryView';
import { BarChart3 } from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'registro' | 'historial'>('dashboard');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session: activeSession } } = await supabase.auth.getSession();
        setSession(activeSession);
        
        if (!activeSession) {
          router.push('/login');
        }
      } catch (err) {
        console.error('Session retrieval error:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <main id="loading-page" className="flex-1 flex flex-col items-center justify-center p-8 min-h-screen bg-[#02040a]">
        <div className="inline-flex p-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6 animate-pulse-slow">
          <BarChart3 className="w-8 h-8 text-indigo-400" />
        </div>
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-sm tracking-wide">Validando credenciales seguras de Casa Bistro...</p>
      </main>
    );
  }

  if (!session) return null;

  return (
    <div id="home-layout" className="flex flex-col md:flex-row min-h-screen bg-[#02040a]">
      {/* Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userEmail={session?.user?.email || 'usuario@casabistro.com'} 
      />

      {/* Main Content Pane */}
      <main id="main-content" className="flex-1 flex flex-col overflow-y-auto max-h-screen bg-transparent">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'registro' && <RegistrationView />}
        {activeTab === 'historial' && <HistoryView />}
      </main>
    </div>
  );
}
