import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'CRÍTICO: Las credenciales de Supabase no están configuradas en .env.local o en Vercel.\n' +
    'Por favor agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

// Configurar el cliente para usar explícitamente el esquema casa_bistro_analitica
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'casa_bistro_analitica',
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

