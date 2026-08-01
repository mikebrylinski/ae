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
| `/about` | About |
| `/contact` | Contact form (UI stub) |
| `*` | 404 |

## Content

Edit JSON in `src/data/`. Image paths point to `/images/...` in `public/`. See [`public/images/README.md`](public/images/README.md) for required filenames. Missing images render as gradient placeholders.

## Future CMS / API

Hooks and TODOs live in `src/lib/cms.ts` (Sanity, Contentful, Contact API, analytics, etc.).
