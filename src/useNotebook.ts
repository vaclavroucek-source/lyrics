import { useEffect, useRef, useState } from 'react';
import { cloud, LOCAL_KEY, readSongs } from './cloud';
import type { Song } from './cloud';
type Pending = Record<string, Song | null>;
type Cache = { songs: Song[]; pending: Pending };
export function useNotebook(userId: string | null) {
  const key = userId ? `slova-cloud-v1:${userId}` : LOCAL_KEY;
  const [initial] = useState<Cache>(() => {
    if (!userId) return { songs: readSongs(key), pending: {} };
    try { const data = JSON.parse(localStorage.getItem(key) || 'null'); if (data && Array.isArray(data.songs) && data.pending && typeof data.pending === 'object') return data; } catch { /* Fetch cloud data instead. */ }
    return { songs: [], pending: {} };
  });
  const [songs, setSongs] = useState<Song[]>(initial.songs);
  const state = useRef(initial);
  const [status, setStatus] = useState(userId ? 'Načítání cloudu…' : 'Uloženo v prohlížeči');
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(!userId);
  const [retry, setRetry] = useState(0);
  const busy = useRef(false);
  function persist(next: Song[]) {
    const pending = { ...state.current.pending };
    if (userId) {
      for (const song of next) if (JSON.stringify(song) !== JSON.stringify(state.current.songs.find(s => s.id === song.id))) pending[song.id] = song;
      for (const old of state.current.songs) if (!next.some(s => s.id === old.id)) pending[old.id] = null;
    }
    state.current = { songs: next, pending };
    setSongs(next);
    try { localStorage.setItem(key, JSON.stringify(userId ? state.current : next)); setError(false); setStatus(userId ? 'Čeká na cloud…' : 'Uloženo v prohlížeči'); }
    catch { setError(true); setStatus('Místní záloha selhala — nezavírej stránku'); }
  }
  useEffect(() => {
    if (!userId || !cloud) return;
    const client = cloud;
    let active = true;
    let initialized = false;
    async function sync() {
      if (busy.current || !active) return;
      busy.current = true;
      try {
        // Only send this account's queue. Never copy another account's cache.
        if (initialized) for (const [id, value] of Object.entries(state.current.pending)) {
          if (!active) return;
          const result = value
            ? await client.from('lyrics').upsert({ id, user_id: userId, title: value.title, text: value.text, updated: value.updated }, { onConflict: 'user_id,id' })
            : await client.from('lyrics').delete().eq('user_id', userId).eq('id', id);
          if (!active) return;
          if (result.error) throw result.error;
          if (state.current.pending[id] === value) delete state.current.pending[id];
          try { localStorage.setItem(key, JSON.stringify(state.current)); } catch { /* Report cache failure below. */ }
        }
        if (!active) return;
        if (Object.keys(state.current.pending).length === 0 || !initialized) {
          const before = state.current;
          const { data, error: fetchError } = await client.from('lyrics').select('id,title,text,updated').eq('user_id', userId).order('updated', { ascending: false });
          if (fetchError) throw fetchError;
          if (!active) return;
          // Edits made while a request was in flight always stay in the editor.
          if (before === state.current) {
            const remote = (data ?? []) as Song[];
            const pending = state.current.pending;
            const merged = [...remote.filter(s => !(s.id in pending)), ...Object.values(pending).filter((s): s is Song => s !== null)];
            state.current = { songs: merged, pending };
            setSongs(merged);
          }
        }
        initialized = true;
        setReady(true);
        try { localStorage.setItem(key, JSON.stringify(state.current)); setError(false); setStatus(Object.keys(state.current.pending).length ? 'Čeká na cloud…' : 'Uloženo v cloudu'); }
        catch { setError(true); setStatus('Cloud dostupný, místní záloha selhala'); }
      } catch {
        if (active) { setError(true); setStatus('Cloud nedostupný — zkusit znovu'); }
      } finally { busy.current = false; }
    }
    void sync();
    const timer = window.setInterval(() => void sync(), 3000);
    const refresh = () => void sync();
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener('online', refresh); };
  }, [userId, key, retry]);
  return { songs, persist, status, error, ready, retry: () => setRetry(n => n + 1), hasPending: () => Object.keys(state.current.pending).length > 0 };
}
