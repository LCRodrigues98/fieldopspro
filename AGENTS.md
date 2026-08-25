# Base44 Dev Environment

FieldOpsPro — Next.js 14 (App Router) app backed by Supabase (hosted SaaS) + Resend (email).

## Run
```
docker compose -f docker-compose.base44.yml up -d
```
- Web entry point: http://localhost:3000 (Next dev server, live reload, bind-mounted source).
- `npm install` runs at container start; `node_modules` lives in an anonymous volume so it isn't shadowed by the host.

## Secrets (external services — set via Base44 dashboard)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project URL + anon key (client-side).
- `SUPABASE_SERVICE_ROLE_KEY` — used server-side by `app/api/*/route.js`.
- `RESEND_API_KEY` — email sending (verification codes).
- `EMAIL_FROM` — defaults to `FieldOpsPro <noreply@fieldopspro.app.br>` in `.env.base44-defaults`.

Local placeholder values in `.env.base44-defaults` let the container boot; real secrets in `/run/base44/app.env` (last `env_file` entry) override them.

## Database
Supabase schema lives in `supabase.sql` — run it in the Supabase SQL editor (tenants, email_verificacoes, usuarios_equipe, clientes, ativos, ordens_servico). Not a local DB.

## Known issue
`app/login/page.js` is incomplete source — it only contains a `handleLogin` function with no React component / default export, so `/login` (the app's main entry, since `/` redirects there) returns 500. Needs a component implementation.

## Verify
```
curl -sf -H "Host: external-preview.example.com" http://localhost:3000/   # -> 307 redirect to /login
```
