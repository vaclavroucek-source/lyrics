import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const cloud = url && key ? createClient(url, key) : null;
export type Song = { id: string; title: string; text: string; updated: number };
export const LOCAL_KEY = 'slova-songs-v1';
export function readSongs(key: string): Song[] {
  try { const value: unknown = JSON.parse(localStorage.getItem(key) || 'null'); if (Array.isArray(value) && value.every(s => s && typeof s.id === 'string' && typeof s.title === 'string' && typeof s.text === 'string' && typeof s.updated === 'number')) return value; } catch { /* Keep stored data untouched on read failure. */ }
  return [];
}
