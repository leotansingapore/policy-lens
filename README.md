# PolicyLens

See through the fine print. An AI second-opinion for your insurance portfolio, built for the Singapore market.

Upload a Life, Health, or Critical Illness policy (PDF) and get a structured breakdown of coverage, hidden exclusions, waiting periods, and the gaps your plan leaves on the table.

## Stack

- Next.js 15 (App Router, server actions)
- Tailwind CSS + hand-rolled components
- Anthropic Claude via `@ai-sdk/anthropic` (Sonnet 4.6)
- `pdf-parse` for policy text extraction
- Portfolio stored in the browser (localStorage) — no account, no tracking

## Run locally

```bash
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm install
npm run dev
```

## Deploy

```bash
vercel --prod
```

Set `ANTHROPIC_API_KEY` in the Vercel project environment.
