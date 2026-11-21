# Docket

Docket checks that suppliers charge and deliver what the contract promised, and helps people recover the money when they don't.

This is a working prototype for a case on the intelligent repository stage of the contract lifecycle. All companies, people and documents are fictional. The site is static: there is no backend and no live AI. AI readings of documents are recorded runs, labelled as such.

## Run it

```
npm install
npm run dev      # http://localhost:5173/docket/
npm test         # 27 tests that lock every number in the story
npm run build
```

## How it is built

- Vite, React 18, TypeScript, Tailwind CSS, Zustand, HashRouter, Vitest.
- All money and date maths lives in `src/lib/engine.ts` and is covered by `src/lib/engine.test.ts`. No component computes a number.
- `src/lib/data.ts` holds the fictional documents, invoices and delivery data. `src/lib/aiRuns.ts` holds the recorded AI outputs.
- Deploys to GitHub Pages from `.github/workflows/deploy.yml`: the workflow runs the tests first and only deploys if they pass.

See `NOTES.md` for the choices made where the brief was silent.
