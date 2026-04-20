# Contributing to Snappy

Thanks for your interest in Snappy — a 100% client-side screenshot beautifier.

## Prerequisites

- Node 20+
- npm 10+

```bash
npm install
```

## Development

```bash
npm run dev          # start the Vite dev server at http://localhost:5173
```

## Quality gates

Snappy aims for a "zero lag, zero bug" feel. Every PR must pass:

```bash
npm run check        # typecheck + lint + unit + build + bundle budget
```

individually, that's:

| Gate | Command | What it checks |
|---|---|---|
| Types | `npm run typecheck` | Strict TS, `noUncheckedIndexedAccess`, etc. |
| Lint | `npm run lint` | Biome (formatter + linter in one) |
| Unit | `npm test` | Vitest — pure utilities, stores, share codec, templates |
| Build | `npm run build` | Vite production build including the export Worker |
| Bundle | `npm run check:bundle` | Gzipped chunk-size budgets (see `scripts/check-bundle.mjs`) |
| E2E | `npm run e2e` | Playwright — app boot, shortcuts, annotations, worker export |

Watch modes:

```bash
npm run test:watch   # Vitest watch
npm run e2e:ui       # Playwright UI mode
```

## Architecture invariants

- `src/canvas/` imports from Konva / react-konva. No React UI chrome lives here.
- `src/components/` owns React chrome. Never imports Konva.
- `src/lib/` is pure TypeScript, no React — safe for Web Workers (the export worker imports from here).
- `src/workers/` never imports React or any store. Inputs arrive as `postMessage`.
- Document state (`useDocumentStore`, undo/redo) is strictly separated from editor state (`useEditorStore`).

## Tests

### Unit tests (Vitest)

Located in `tests/unit/`. Use `happy-dom` for DOM APIs. Canvas rendering is **not** tested here — that's the E2E layer's job.

### E2E tests (Playwright)

Located in `tests/e2e/`. Drive the app through the dev hook `window.__SNAPPY__` that is installed in dev builds (see `src/main.tsx`). That exposes each Zustand store for programmatic setup.

Examples of what E2E tests cover:
- App boot + zero console errors
- Keyboard shortcuts (⌘K command palette, etc.)
- Template apply changes canvas size
- Annotation CRUD + undo/redo
- Worker PNG export produces a valid PNG at the requested resolution
- dHash of a deterministic shader scene against a committed golden in `tests/goldens/`

### Updating goldens

Export goldens live in `tests/goldens/*.dhash` and tolerate up to 8 Hamming bits of drift to absorb AA differences. To regenerate after an intentional rendering change:

```bash
rm tests/goldens/*.dhash
npm run e2e
git add tests/goldens
```

Review the regenerated goldens in the diff — they should match your intended visual change.

## Bundle budgets

See `scripts/check-bundle.mjs`. Current budgets (gzipped):

- Any JS chunk: 110 KB
- Any CSS chunk: 20 KB
- Editor entry (`index-*.js`): 60 KB
- Total JS: 260 KB

When adding a feature that risks breaking these, split it into a lazy-loaded chunk (`React.lazy`, dynamic import).

## Commit messages

Conventional-ish. Keep the subject under 70 characters. Body explains *why*, not *what*.

## Pull requests

- One logical change per PR.
- Include a short test plan in the description.
- If the change is visible, attach a before/after screenshot or short GIF.
- CI must be green before merge.
