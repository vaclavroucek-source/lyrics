# Cloudové ukládání přes Supabase

## 1. Založ projekt

Na https://supabase.com/dashboard založ účet a nový projekt. Zvol evropský region. Heslo databáze si ulož bezpečně; do aplikace ho nezadávej. Stačí bezplatný tarif v jeho limitech.

## 2. Vytvoř soukromou tabulku

V projektu otevři **SQL Editor → New query**. Zkopíruj celý obsah `supabase/schema.sql` a spusť ho jednou. Skript zapíná Row Level Security a pravidla, která dovolují přístup pouze vlastníkovi textu. Bez těchto pravidel aplikaci nenasazuj. Nepoužívej veřejná pravidla „allow all“.

## 3. Nastav přihlášení

V **Authentication → URL Configuration** nastav **Site URL** na přesnou HTTPS adresu svého nasazení na Vercelu (bez cesty). Stejnou adresu přidej do **Redirect URLs**. Pro lokální vývoj můžeš přidat `http://localhost:5173`. Nepřidávej cizí ani široce wildcardované domény. V **Authentication → Providers** ponech zapnutý Email a povol registraci nových uživatelů, pokud jsi ji vypnul.

Přihlášení používá jednorázový odkaz v e-mailu. Otevři odkaz na zařízení, na kterém se chceš přihlásit. Na mobilu použij stejný e-mail jako na počítači. Výchozí odesílač Supabase má omezení a může povolovat jen e-maily členů projektu; pro další uživatele a spolehlivé odesílání nastav **Authentication → Email / SMTP Settings** s vlastním poskytovatelem. Při testu zkontroluj spam a limity odesílání.

## 4. Propoj Vercel

V Supabase otevři **Project Settings → API Keys** (nebo dialog **Connect**) a najdi **Project URL** a **publishable key**. Ve starších projektech lze použít veřejný `anon` klíč. Nikdy nepoužívej `service_role`, `sb_secret_…`, databázové heslo ani přímý connection string.

V projektu lyrics na Vercelu otevři **Settings → Environment Variables** a přidej:

- `VITE_SUPABASE_URL` = Project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` = veřejný publishable (nebo anon) klíč

Vyber Production (případně i Preview a Development) a ulož. V **Deployments** proveď **Redeploy** posledního nasazení — Vite načítá proměnné při sestavení. Tyto dvě hodnoty jsou veřejná konfigurace klienta; bezpečnost dat zajišťuje přihlášení a databázová pravidla.

Pro lokální vývoj zkopíruj `.env.example` do `.env.local`, vyplň veřejné hodnoty a restartuj `npm run dev`. `.env.local` je ignorovaný Gitem.

## 5. Přenes starší texty a ověř synchronizaci

Na původním počítači otevři stejnou adresu, na které jsi texty psal, přihlas se a klikni na **Importovat místní texty**. Import vždy vytváří nové kopie, takže ho neopakuj zbytečně. Původní místní texty zůstávají zachované. Texty z jiné domény prohlížeč automaticky načíst nemůže.

Počkej na **Uloženo v cloudu**. Na mobilu otevři stejný web, přihlas se stejným e-mailem a ověř název i obsah. Změny se odesílají přibližně každé 3 sekundy; načítají se i při návratu do okna. Nezavírej stránku, dokud ukazuje čekající změny. Při výpadku sítě zůstává fronta změn v místní záloze pro konkrétní účet a zkusí se odeslat po návratu připojení. Po vymazání dat prohlížeče se neodeslané změny ztratí. Při odhlášení se data v paměti oddělí, místní záloha účtu však zůstává na zařízení; na sdíleném počítači po synchronizaci vymaž data webu.

Současné psaní do stejného textu na více zařízeních nemá slučování změn: poslední přijaté uložení přepisuje předchozí. Používej vždy jedno zařízení a před přechodem počkej na dokončení synchronizace. Při neúspěšném načtení účtu editor cloudových textů nepovolí úpravy; oprav nastavení tabulky, pravidel nebo připojení a klikni na stav synchronizace.

## Kontrola soukromí před používáním

Vytvoř text pod účtem A. V jiném profilu prohlížeče přihlas účet B: text A se nesmí zobrazit. V Supabase SQL Editoru zkontroluj zapnuté RLS a čtyři zásady podle `schema.sql`. Účet bez přihlášení nesmí mít přístup k tabulce. Aplikace nevyžaduje servisní klíč.

## Stav ověření

Sestavení a lint lze ověřit bez projektu pomocí `npm run build` a `npm run lint`. Skutečné přihlášení, e-mail, databázová pravidla a synchronizaci dvou zařízení je nutné ověřit po propojení živého projektu podle kroků výše.
