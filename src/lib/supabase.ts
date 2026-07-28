import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Cliente de Supabase para uso en el cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Nota: Este archivo está preparado para Supabase pero actualmente
// la aplicación utiliza datos simulados (mock-data.ts).
// Para activar Supabase:
// 1. Configura las variables de entorno en .env
// 2. Crea las tablas necesarias en Supabase
// 3. Implementa las funciones de acceso a datos aquí
