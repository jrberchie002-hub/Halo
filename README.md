# Halo
Chat app for friends. Stories, calls, streaks. Static frontend in `public/`, serverless API in `api/`.

## Run locally
`node dev.js` then open http://localhost:3000 (in-memory data).

## Deploy
1. Supabase: run `schema.sql` in the SQL editor.
2. Vercel: import this repo, add env vars `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.
