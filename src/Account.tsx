import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { cloud } from './cloud';
import { Editor } from './App';
export default function Account() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!!cloud);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  useEffect(() => {
    if (!cloud) return;
    let active = true;
    const { data: { subscription } } = cloud.auth.onAuthStateChange((_event, next) => { if (active) { setSession(next); setLoading(false); if (next) setShowLogin(false); } });
    void cloud.auth.getSession().then(({ data, error }) => { if (active) { setSession(data.session); setLoading(false); if (error) setMessage('Přihlášení se nepodařilo obnovit. Přihlas se znovu.'); } });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  async function login(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cloud) return;
    setSending(true); setMessage('');
    try {
      const { error } = await cloud.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin } });
      setMessage(error ? 'Odkaz se nepodařilo odeslat. Zkontroluj e-mail a zkus to později.' : 'Podívej se do e-mailu a otevři přihlašovací odkaz na tomto zařízení.');
    } catch { setMessage('Připojení selhalo. Zkus to znovu.'); }
    finally { setSending(false); }
  }
  async function logout() {
    if (!cloud) return;
    const { error } = await cloud.auth.signOut();
    if (error) window.alert('Odhlášení se nezdařilo. Zkus to znovu.');
  }
  if (loading) return <div className="auth-loading" role="status">Načítání účtu…</div>;
  return <><Editor key={session?.user.id ?? 'local'} userId={session?.user.id ?? null} email={session?.user.email} onLogin={() => setShowLogin(true)} onLogout={() => void logout()}/>{showLogin && <div className="auth-overlay"><section className="auth-card" role="dialog" aria-modal="true" aria-labelledby="login-title"><button className="auth-close" aria-label="Zavřít přihlášení" onClick={() => setShowLogin(false)}>×</button><h2 id="login-title">Tvoje slova, kdekoliv.</h2>{cloud ? <><p>Přihlas se stejným e-mailem na počítači i mobilu. Tvoje texty uvidíš jen ty.</p><form onSubmit={login}><label htmlFor="login-email">E-mail</label><input autoFocus id="login-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tvuj@email.cz"/><button disabled={sending} type="submit">{sending ? 'Odesílání…' : 'Poslat přihlašovací odkaz'}</button></form><p role="status">{message}</p></> : <p>Cloud zatím není aktivovaný. Přihlášení bude dostupné po dokončení nastavení. Texty dál zůstávají v tomto prohlížeči.</p>}</section></div>}</>;
}
