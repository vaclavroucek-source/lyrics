import { useRef, useState } from 'react';
import { ArrowDownToLine, ArrowLeft, Check, ChevronDown, FileText, Maximize2, Minimize2, MoreHorizontal, Music2, Plus, Search, Trash2, X } from 'lucide-react';

type Song = { id: string; title: string; text: string; updated: number };
const KEY = 'slova-songs-v1';
function initialSongs(): Song[] {
  try { const value = JSON.parse(localStorage.getItem(KEY) || 'null'); if (Array.isArray(value) && value.every(s => typeof s.id === 'string' && typeof s.title === 'string' && typeof s.text === 'string' && typeof s.updated === 'number')) return value; } catch { /* Start with an empty notebook if storage is unavailable. */ }
  return [];
}
export default function App() {
  const [songs, setSongs] = useState<Song[]>(initialSongs);
  const [selected, setSelected] = useState<string | null>(() => initialSongs()[0]?.id ?? null);
  const [query, setQuery] = useState('');
  const [focus, setFocus] = useState(false);
  const [menu, setMenu] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [sort, setSort] = useState('updated');
  const [mobileEditor, setMobileEditor] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const song = songs.find(s => s.id === selected);
  function persist(next: Song[]) { setSongs(next); try { localStorage.setItem(KEY, JSON.stringify(next)); setSaveError(false); } catch { setSaveError(true); } }
  function createSong() { const next = { id: crypto.randomUUID(), title: '', text: '', updated: Date.now() }; persist([next, ...songs]); setSelected(next.id); setMobileEditor(true); setMenu(false); requestAnimationFrame(() => titleRef.current?.focus()); }
  function update(patch: Partial<Song>) { persist(songs.map(s => s.id === selected ? { ...s, ...patch, updated: Date.now() } : s)); }
  function remove() { if (!song || !window.confirm(`Opravdu smazat „${song.title || 'Text bez názvu'}“?`)) return; const remaining = songs.filter(s => s.id !== song.id); persist(remaining); setSelected(remaining[0]?.id ?? null); setMenu(false); }
  function download() { if (!song) return; const url = URL.createObjectURL(new Blob([`${song.title || 'Text bez názvu'}\n\n${song.text}`], { type: 'text/plain;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = `${song.title || 'Text bez názvu'}.txt`; a.click(); URL.revokeObjectURL(url); setMenu(false); }
  const visible = songs.filter(s => `${s.title} ${s.text}`.toLocaleLowerCase('cs').includes(query.toLocaleLowerCase('cs'))).sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title, 'cs') : b.updated - a.updated);
  const words = song?.text.trim() ? song.text.trim().split(/\s+/u).length : 0;
  return <div className={`app ${focus ? 'focused' : ''} ${mobileEditor ? 'mobile-editor' : ''}`}>
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="Slova – domů"><span className="brand-icon"><Music2 size={21}/></span>slova<span className="brand-dot">.</span></a>
      <div className="workspace-label">TVŮJ PROSTOR PRO HUDBU</div>
      <button className="new-button" onClick={createSong}><Plus size={18}/> Nový text <span>＋</span></button>
      <label className="search"><Search size={16}/><input aria-label="Hledat v textech" placeholder="Hledat v textech…" value={query} onChange={e => setQuery(e.target.value)}/>{query && <button aria-label="Vymazat hledání" onClick={() => setQuery('')}><X size={14}/></button>}</label>
      <div className="list-heading"><span>Moje texty <b>{songs.length}</b></span><div className="sort"><select aria-label="Řazení textů" value={sort} onChange={e => setSort(e.target.value)}><option value="updated">Nejnovější</option><option value="title">Podle názvu</option></select><ChevronDown size={12}/></div></div>
      <div className="song-list">{visible.map(s => <button key={s.id} className={`song-item ${s.id === selected ? 'active' : ''}`} onClick={() => { setSelected(s.id); setMobileEditor(true); setMenu(false); }}><div className="song-item-title"><FileText size={16}/><strong>{s.title || 'Text bez názvu'}</strong></div><p>{s.text.replace(/\n/g, ' ') || 'První slova teprve přijdou…'}</p><time>{new Date(s.updated).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' })}</time></button>)}{visible.length === 0 && <div className="empty-list"><FileText size={23} strokeWidth={1.3}/><p>{query ? 'Žádný text nenalezen' : 'Tady začínají tvoje písně'}</p><span>{query ? 'Zkus jiné slovo nebo název.' : 'Vytvoř svůj první text.'}</span></div>}</div>
      <div className="sidebar-footer"><span className="local-dot"/> Uloženo v tomto prohlížeči<small>Jen ty a tvoje slova.</small></div>
    </aside>
    <main className="main">
      <header className="toolbar"><div className="breadcrumb"><button className="back-mobile" aria-label="Zpět na texty" onClick={() => setMobileEditor(false)}><ArrowLeft size={18}/></button><Music2 size={16}/><span>Moje texty</span><span className="slash">/</span><strong>{song ? song.title || 'Text bez názvu' : 'Nový začátek'}</strong></div><div className="toolbar-actions">{song && <span className={`saved ${saveError ? 'error' : ''}`} role="status">{saveError ? <X size={14}/> : <Check size={14}/>}<span>{saveError ? 'Uložení selhalo' : 'Uloženo'}</span></span>}<button className={`icon-button ${focus ? 'selected' : ''}`} aria-label={focus ? 'Ukončit soustředěné psaní' : 'Soustředěné psaní'} title="Soustředěné psaní" onClick={() => setFocus(!focus)}>{focus ? <Minimize2 size={17}/> : <Maximize2 size={17}/>}</button>{song && <div className="menu-wrap"><button className="icon-button" aria-label="Možnosti textu" aria-expanded={menu} onClick={() => setMenu(!menu)}><MoreHorizontal size={21}/></button>{menu && <><button className="menu-dismiss" aria-label="Zavřít nabídku" onClick={() => setMenu(false)}/><div className="dropdown"><button onClick={download}><ArrowDownToLine size={16}/> Stáhnout jako .txt</button><button className="danger" onClick={remove}><Trash2 size={16}/> Smazat text</button></div></>}</div>}</div></header>
      {song ? <div className="document"><div className="document-eyebrow"><span/> PROSTOR PRO TVŮJ PŘÍBĚH</div><input ref={titleRef} className="title-input" aria-label="Název písně" placeholder="Text bez názvu" value={song.title} onChange={e => update({ title: e.target.value })}/><div className="document-meta">Text písně<span>·</span>{new Date(song.updated).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })}</div><div className="paper-rule"/><textarea className="lyrics" aria-label="Text písně" placeholder={'Každá píseň začíná prvním slovem.\nNapiš to svoje…'} value={song.text} onChange={e => update({ text: e.target.value })} spellCheck={false}/></div> : <div className="welcome"><div className="welcome-symbol"><Music2 size={32} strokeWidth={1.3}/><span>✧</span></div><div className="eyebrow">MÍSTO, KDE VZNIKAJÍ PÍSNĚ</div><h1>Dej svým myšlenkám<br/>vlastní melodii.</h1><p>Slova, která nechceš zapomenout.<br/>Příběhy, které si zaslouží být slyšet.</p><button className="welcome-button" onClick={createSong}><Plus size={17}/> Napsat první text</button><div className="welcome-note">Žádné rušení. Jen prostor pro tvoji inspiraci.</div></div>}
      <footer className="editor-footer"><span><span className="footer-dot"/> {song ? 'Každé slovo se počítá.' : 'Dobrý text začíná prázdnou stránkou.'}</span><div><span>{words} slov</span><i/><span>{song?.text.length ?? 0} znaků</span></div></footer>
    </main>
  </div>;
}
