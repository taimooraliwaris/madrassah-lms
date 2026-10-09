# Madrassah LMS

A React and TanStack learning management system covering students, teachers, Hifz/Nazra classes, attendance, assessments, fees and parent communication.

## Public portfolio demo

The default Vercel configuration builds a **read-only, static demo** with invented data. It requires no database, API keys, email service or shared login credentials.

```sh
npm ci --ignore-scripts
npm run dev:demo
npm run build:demo
```

The demo source is generated into `demo-src/` from `src/`. Production source and migrations remain separate. `demo/prepare.mjs` replaces the database client with local fixtures, removes server authentication modules and disables account-management functions. Every data write is rejected. Content Security Policy blocks external connections and permits embedding only by the portfolio domain. There is no deployed API or server function.

Deploy this repository on Vercel using `vercel.json`. Git pushes trigger rebuilds. No environment variables are needed for the demo. Check that the account remains on a free plan before deployment.

## Full application

`src/` contains the original application and `supabase/migrations/` its schema history. Running the full application requires a separately provisioned Supabase project and a compatible TanStack Start server deployment. This archive has not received a full production security audit. Never connect the public demo to a live school database.

Use `.env.example` for variable names. Do not commit `.env`, service keys, real student records, database exports or uploaded documents. The public demo is not proof that production authorization policies have been audited.

## Showcase verification

Verify the dashboard, students/search, teachers, classes, attendance, performance, exams and fee screens. Attempted edits must show the read-only error and leave fixtures unchanged. Check browser traffic and the built assets for any production Supabase URL or key before publishing.
