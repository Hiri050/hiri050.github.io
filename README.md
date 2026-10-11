# hiri050.github.io

Personal site of Hirdianshu Singla. React + TypeScript + Vite, with a single WebGL scene (React Three Fiber) behind the page and GSAP for motion.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production build into dist/
npm run preview   # serve dist/ locally
```

## Editing content

All copy lives in `src/content/`. Components only render it.

| File | What it holds |
| --- | --- |
| `profile.ts` | name, tagline, email, GitHub, LinkedIn (empty = hidden), résumé path |
| `projects.ts` | the eight case studies (overview → links) and the archive list |
| `experience.ts` | roles for the timeline |
| `skills.ts` | skill constellation + the six "subsystems" in About |
| `education.ts` | school, coursework, certifications, highlights |

Search for `TODO(Hirdianshu)` to find the gaps: repository links and team sizes.

- Adding a project link: set `links.github` or `links.demo` in `projects.ts`. The buttons appear automatically.
- Replacing the résumé: overwrite `public/resume.pdf`.
- Project images go in `public/media/` and are referenced from a project's `media` array.

## How the scene works

`src/three/shaders.ts` holds one instanced draw call of voxels (4,096 on desktop, 729 on phones and low-power devices). Each voxel's position comes from its index in the vertex shader, which blends between four layouts as the page scrolls: terrain → chip die → lab floor → cube. Sections opt in with `data-scene="0..3"`, and `src/lib/director.ts` maps scroll position to scene state.

Performance guards: adaptive render resolution (`Stage.tsx`), rendering pauses while a case study covers the screen, `prefers-reduced-motion` gives a static scene with no smooth scroll or pinning, and a CSS fallback is used when WebGL2 is unavailable.

Easter eggs: ↑ ↑ ↓ ↓ ← → ← → B A toggles developer mode. The browser console has a message for curious engineers.

## Deploying

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main`.
**One-time setup:** repo Settings → Pages → Source → **GitHub Actions**.
