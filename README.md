# Andy Ebert — Portfolio

Cinematic portfolio site for monitor engineer, musical director, and live production professional **Andy Ebert**.

## Stack

- Vite + React 19 + TypeScript
- React Router
- Tailwind CSS v4
- Framer Motion + GSAP (hero) + Lenis
- Lucide icons
- JSON content under `src/data/`

## Design

Deep black (`#000`) with neon lime accent (`#B8FF00`). Sharp corners, bold all-caps headings (Space Grotesk), Inter body. Logo: **ANDY** white + **EBERT** lime.

## Develop

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

## Routes

| Path | Page |
|------|------|
| `/` | Home |
| `/portfolio` | Project grid |
| `/portfolio/:slug` | Project detail |
| `/experience` | Timeline & skills |
| `/media` | Press, bio, gallery |
| `/gallery` | Photo gallery |
| `/about` | About |
| `/contact` | Contact form |
| `/admin` | Password-protected credits & gallery editor |
| `*` | 404 |

## Content

Edit JSON in `src/data/`. Image paths point to `/images/...` in `public/`. See [`public/images/README.md`](public/images/README.md) for required filenames. Missing images render as gradient placeholders.

## Admin

Andy signs in at `/admin` with `VITE_ADMIN_PASSWORD` (set in `.env.local` locally, and as a Vercel env var in production). Use the **Gallery** tab to upload, replace, or delete photos, edit tags, and add captions (also used as alt text). **Credits** is the year-by-year experience list.

- **Local:** the dev server writes `src/data/gallery.json` and files under `public/images/gallery/`.
- **Production:** connect a **public** [Vercel Blob](https://vercel.com/docs/vercel-blob) store to the project (**Storage → Create Database → Blob**), include Production, then redeploy. Also set `ADMIN_PASSWORD` (same as the `/admin` login). Vercel injects `BLOB_STORE_ID` and `BLOB_READ_WRITE_TOKEN`; new photos and gallery metadata live in Blob. `/gallery` loads them from `GET /api/gallery` and falls back to the bundled JSON if Blob is empty.

## Future CMS / API

Gallery editing lives at `/admin`. Other CMS hooks and TODOs are in `src/lib/cms.ts`. Contact form: `POST /api/contact` (Resend → `CONTACT_TO_EMAIL`).
