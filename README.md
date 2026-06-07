<h1 align="center">Fraser Grads '26</h1>

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Go](https://img.shields.io/badge/Go-1.26-00ADD8?logo=go&logoColor=white)
![Postgres](https://img.shields.io/badge/Postgres-Supabase-3FCF8E?logo=supabase&logoColor=white)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2-F38020?logo=cloudflare&logoColor=white)

Fraser Grads '26 is an unofficial grad site for Fraser's Class of 2026. It puts the class directory, senior survey, class stats, and future memory/scrapbook features in one place so our grad class can look back after graduation and stay connected. Also a good way for lower grades to reach out or see some stats to know more about senior life!

This project was a fun way to make a project that actually matters but allows me to learn (Golang + Docker + etc)

## Tech Stack

- **Frontend:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- **Auth:** Auth.js / NextAuth v5 beta with Google OAuth and the Postgres adapter
- **API:** Go 1.26, chi router, HMAC-signed internal requests from Next.js
- **Database:** Postgres (Supabase)
- **Object storage:** Cloudflare R2 for submitted photos
- **Charts:** Recharts
- **Validation:** Zod in the Next.js app, generated Go validators for API-side survey validation
- **Deployment shape:** Next.js on Vercel, Go API on Cloud Run or any HTTP host, Postgres and R2 as managed services

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local env file:

```bash
cp .env.example .env
```

Apply the database migrations in `db/migrations/` to your Postgres database. The first migration creates the Auth.js adapter tables plus the `surveys` table.

Start the Go API in one terminal:

```bash
cd api
go run ./cmd/server
```

Start the Next.js app in another terminal:

```bash
npm run dev
```

## Code Quality Note

This codebase was built with product shipping as the priority. Some areas are intentionally pragmatic rather than the cleanest possible architecture: duplicated UI patterns, rough edges around deployment setup, limited abstractions, and features that were finished under deadline pressure. Treat the current code as a working product baseline, not a polished reference implementation.
