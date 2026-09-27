import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = (typeof url === 'string' && url.trim().startsWith('http'))
    ? url.trim()
    : 'https://placeholder.supabase.co';

const supabaseAnonKey = (typeof key === 'string' && key.trim().length > 0)
    ? key.trim()
    : 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);