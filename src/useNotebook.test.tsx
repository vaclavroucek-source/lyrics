// @vitest-environment jsdom
import { act, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Song } from './cloud';
const backend = vi.hoisted(() => ({ rows: [] as (Song & { user_id: string })[], fail: false }));
vi.mock('./cloud', async importOriginal => {
  const original = await importOriginal<typeof import('./cloud')>();
  return { ...original, cloud: { from: () => ({
    select: () => ({ eq: (_key: string, user: string) => ({ order: async () => ({ data: backend.rows.filter(s => s.user_id === user), error: backend.fail ? new Error('Offline') : null }) }) }),
    upsert: async (song: Song & { user_id: string }) => {
      if (backend.fail) return { error: new Error('Offline') };
      backend.rows = [...backend.rows.filter(s => !(s.id === song.id && s.user_id === song.user_id)), song];
      return { error: null };
    },
    delete: () => ({ eq: (_key: string, user: string) => ({ eq: async (_idKey: string, id: string) => {
      if (backend.fail) return { error: new Error('Offline') };
      backend.rows = backend.rows.filter(s => !(s.user_id === user && s.id === id)); return { error: null };
    } }) }),
  }) } };
});
import { useNotebook } from './useNotebook';
let current: ReturnType<typeof useNotebook>;
let root: ReturnType<typeof createRoot>;
function Probe({ user }: { user: string | null }) { const notebook = useNotebook(user); useLayoutEffect(() => { current = notebook; }); return null; }
async function mount(user: string | null) { await act(async () => { root.render(<Probe key={user ?? 'local'} user={user}/>); }); }
async function tick() { await act(async () => { await vi.advanceTimersByTimeAsync(3000); }); }
const song: Song = { id: 'one', title: 'Moje píseň', text: 'První verš', updated: 10 };
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.useFakeTimers(); localStorage.clear(); backend.rows = []; backend.fail = false;
  root = createRoot(document.createElement('div'));
});
afterEach(async () => { await act(async () => root.unmount()); vi.useRealTimers(); });
describe('Notebook persistence and synchronization', () => {
  it('keeps local writing available without an account', async () => {
    await mount(null); act(() => current.persist([song]));
    expect(JSON.parse(localStorage.getItem('slova-songs-v1')!)).toEqual([song]);
    expect(backend.rows).toHaveLength(0);
  });
  it('loads only the signed-in account and sends changes and deletions', async () => {
    backend.rows = [{ ...song, user_id: 'a' }, { ...song, id: 'other', user_id: 'b' }];
    await mount('a'); expect(current.ready).toBe(true); expect(current.songs.map(s => s.id)).toEqual(['one']);
    act(() => current.persist([{ ...song, text: 'Nový verš' }]));
    expect(current.hasPending()).toBe(true); await tick();
    expect(backend.rows.find(s => s.user_id === 'a')?.text).toBe('Nový verš'); expect(current.hasPending()).toBe(false);
    act(() => current.persist([])); await tick(); expect(backend.rows.map(s => s.user_id)).toEqual(['b']);
  });
  it('retains offline edits across remount and sends them after recovery', async () => {
    backend.rows = [{ ...song, user_id: 'a' }]; await mount('a'); backend.fail = true;
    act(() => current.persist([{ ...song, text: 'Offline verš' }])); await tick();
    expect(current.error).toBe(true); expect(current.hasPending()).toBe(true);
    await act(async () => root.render(<></>)); backend.fail = false; await mount('a'); await tick();
    expect(backend.rows[0].text).toBe('Offline verš'); expect(current.hasPending()).toBe(false);
  });
  it('never imports local or other-account drafts automatically', async () => {
    localStorage.setItem('slova-songs-v1', JSON.stringify([song]));
    backend.rows = [{ ...song, user_id: 'a' }]; await mount('a');
    backend.fail = true; act(() => current.persist([{ ...song, text: 'Private A' }]));
    backend.fail = false; await mount('b'); await tick();
    expect(current.songs).toEqual([]); expect(backend.rows.some(s => s.user_id === 'b')).toBe(false);
    expect(localStorage.getItem('slova-cloud-v1:a')).toContain('Private A');
  });
  it('does not enable editing when the initial cloud read fails', async () => {
    backend.fail = true; await mount('a'); expect(current.ready).toBe(false); expect(current.error).toBe(true);
    backend.fail = false; await tick(); expect(current.ready).toBe(true);
  });
  it('refreshes changes from another device when there are no pending writes', async () => {
    await mount('a'); backend.rows = [{ ...song, user_id: 'a' }]; await tick();
    expect(current.songs[0].title).toBe(song.title);
  });
});
