import { createClient } from '@supabase/supabase-js';

// Usar valores placeholder en lugar de cadena vacía para evitar que createClient falle en la inicialización estática
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-anon-key';

if (supabaseUrl.includes('placeholder-url') || supabaseAnonKey === 'placeholder-anon-key') {
  console.error(
    'CRÍTICO: Las credenciales de Supabase no están configuradas en .env.local.\n' +
    'Por favor reinicia el servidor de desarrollo (npm run dev) después de agregar las variables.'
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

