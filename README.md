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
```

Texty jsou uložené pouze v localStorage daného prohlížeče. Pro zálohu použijte export do `.txt`. Aplikace nemá server ani synchronizaci mezi zařízeními.

## Nasazení

Na Vercel nebo Netlify použijte příkaz `npm run build` a výstupní složku `dist`.
