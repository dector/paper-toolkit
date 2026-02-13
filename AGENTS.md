# AGENTS.md

Guidance for autonomous coding agents working in this repository.

## Project Snapshot

- Stack: Astro 5 + TypeScript strict config (`astro/tsconfigs/strict`) with a React island for interactivity.
- Runtime/tooling: Bun (`bun.lock` present).
- App purpose: paper pattern configurator with live preview and PDF generation.
- Main route: `src/pages/index.astro` (hydrates the configurator using `client:load`).
- Main interactive entrypoint: `src/components/PaperConfigurator.tsx` with feature modules in `src/components/paper-configurator/` and styles in `src/components/PaperConfigurator.css`.
- Generated output: `dist/`.
- Verification notes: `docs/verification/milestone-8-verification-handoff.md`.

## Libraries and Technical Details

Current runtime dependencies from `package.json`:

- `astro` (`^5.17.1`): framework and build pipeline.
- `@astrojs/react` (`^4.4.2`): React integration for Astro islands.
- `react` / `react-dom` (`^19.2.4`): interactive configurator UI.
- `jspdf` (`^4.1.0`): client-side PDF generation for Print flow.

Implementation details worth preserving:

- PDF generation is performed in-browser from current settings (size, orientation, color, spacing, width, padding).
- Dot pattern is rendered in millimeter units in PDF for print fidelity.
- Print flow attempts to open a PDF tab and invoke print, with download fallback if popup/print is blocked.
- Form and preview synchronization are reducer-driven via `src/components/paper-configurator/model.ts`.

## Rule Files (Cursor/Copilot)

Repository scan results:

- `.cursorrules`: not found.
- `.cursor/rules/`: not found.
- `.github/copilot-instructions.md`: not found.

If any of these files are added later, treat them as higher-priority behavioral constraints and update this document.

## Working Agreements

- Use Bun commands by default unless the user explicitly requests another toolchain.
- Run commands from repository root.
- Make minimal, incremental changes; avoid broad refactors unless requested.
- Do not add dependencies unless clearly required by scope.
- Preserve current UX/behavior unless the user asks for changes.

## Commands

All commands assume execution from repo root.

### Setup / Dev

```bash
bun install
bun run dev
```

### Build / Preview

```bash
bun run build
bun run preview
```

### Typecheck / Diagnostics

No dedicated lint script is configured.

Primary quality gate:

```bash
bun run build
```

Optional Astro checker (requires packages if not already installed locally):

```bash
bun run astro check
```

### Tests

No committed test framework config or `test` script exists yet.

If adding tests with Bun runner, use:

```bash
bun test
bun test src/path/to/file.test.ts
bun test --test-name-pattern "renders preview"
```

## Code Style and Conventions

### TypeScript / Strictness

- Keep compatibility with strict TypeScript settings.
- Avoid `any`; if unavoidable, constrain and justify usage.
- Prefer explicit types at public boundaries.

### Imports / Modules

- Project is ESM (`"type": "module"`), use `import`/`export` only.
- Keep imports minimal and remove unused entries.

### Formatting and Naming

- Follow existing local formatting; avoid unrelated reformatting.
- `.astro` files use tab indentation; keep consistency.
- Use descriptive names (`camelCase` vars/functions, `PascalCase` components).

### UI / Behavior Expectations

- Keep two-panel desktop layout and stacked mobile layout behavior.
- Maintain live preview updates on setting changes.
- Keep print/PDF behavior resilient with user-facing fallback messaging.

## Change Scope and Safety

- Do not commit generated artifacts: `dist/`, `.astro/`, `node_modules/`.
- Respect `.gitignore` and env-file exclusions.
- If scripts/tooling/workflow change, update this file with exact commands and caveats.

## Maintenance Note

This file reflects the current configurator + PDF workflow state. Revisit it whenever architecture, dependencies, QA workflow, or agent policy files change.
