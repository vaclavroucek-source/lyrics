# Slova / Lyrics

Jednoduchý bílý editor textů písní v češtině. Pojmenování textů, automatické ukládání, vyhledávání, řazení, režim soustředění a export do `.txt`.

## Spuštění

Vyžaduje Node.js 24 a npm.

```sh
npm ci
npm run dev
```

## Kontroly

```sh
npm run build
npm run lint
npm test
```

Bez přihlášení se texty ukládají v prohlížeči. Volitelné přihlášení přes Supabase umožňuje soukromé cloudové ukládání a přístup z mobilu. Postup propojení s Vercel je v [CLOUD_SETUP.md](CLOUD_SETUP.md). Pro zálohu lze použít export do `.txt`.

## Nasazení

Na Vercel nebo Netlify použijte příkaz `npm run build` a výstupní složku `dist`.
