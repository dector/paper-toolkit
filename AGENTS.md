# AGENTS.md

Guidance for autonomous coding agents working in this repository.

## Project Snapshot

- Stack: Astro 5 + TypeScript, with strict config via `astro/tsconfigs/strict`.
- Runtime/tooling: Bun (`bun.lock` is present).
- Current app shape: minimal Astro starter.
- Main source route: `src/pages/index.astro`.
- Generated output: `dist/`.

## Rule Files (Cursor/Copilot)

Repository scan results:

- `.cursorrules`: not found.
- `.cursor/rules/`: not found.
- `.github/copilot-instructions.md`: not found.

If any of these files are added later, treat them as higher-priority behavioral constraints and update this document.

## Working Agreements

- Use Bun commands by default unless the user explicitly requests another toolchain.
- Run commands from repository root.
- Make minimal, incremental changes; avoid large refactors unless requested.
- Do not add dependencies unless they are clearly necessary for the task.
- Preserve starter-level simplicity unless the user asks for architecture expansion.

## Commands

All commands assume execution from repo root.

### Setup / Dev

```bash
bun install
bun run dev
```

Direct Astro CLI equivalent for dev:

```bash
bun run astro dev
```

### Build / Preview

```bash
bun run build
bun run preview
```

General Astro CLI passthrough:

```bash
bun run astro -- --help
```

### Lint / Typecheck

There is no dedicated lint script in `package.json` right now.

Use Astro's checker for diagnostics and type-related validation:

```bash
bun run astro check
```

Use build as an additional quality gate when needed:

```bash
bun run build
```

### Tests (Single-Test Guidance Included)

There is no committed test framework config or test script yet, but Bun's built-in runner is available.

Run all tests:

```bash
bun test
```

Run one test file (preferred single-test workflow):

```bash
bun test src/path/to/file.test.ts
```

Run tests by filename fragment:

```bash
bun test component-name
```

Run one named test via regex:

```bash
bun test --test-name-pattern "renders hero title"
```

Allow empty test suites (useful in early CI/scaffolding):

```bash
bun test --pass-with-no-tests
```

## Code Style and Conventions

Derived from repository config and existing source files.

### TypeScript / Strictness

- Keep code compatible with strict TypeScript settings.
- `tsconfig.json` extends `astro/tsconfigs/strict`; do not weaken this without explicit need.
- Avoid `any`; if unavoidable, constrain and document why.
- Prefer explicit types at public boundaries (exports, params, return types).
- Preserve `exclude: ["dist"]` semantics.

### Imports / Modules

- Project uses ESM (`"type": "module"`), so use `import`/`export`.
- Do not introduce CommonJS (`require`, `module.exports`).
- Keep imports minimal and remove unused entries.
- Prefer named imports where practical for readability.

### Formatting

- Follow local file style; avoid reformatting unrelated lines.
- Existing JS config files use semicolons and single quotes.
- Existing `.astro` markup uses tab indentation; keep local indentation consistent.
- Keep `.astro` frontmatter concise and deterministic.

### Naming

- Use descriptive, intention-revealing names.
- `camelCase` for variables and functions.
- `PascalCase` for component-like entities.
- Route files should remain lowercase/kebab-case unless Astro conventions require otherwise.
- Avoid single-letter names except short loop indices.

### Error Handling

- Fail fast for invalid input in utilities and helper functions.
- Provide actionable error messages with context.
- Do not swallow exceptions silently.
- In UI routes/components, prefer safe fallbacks over hard crashes when practical.

### Astro-Specific Practices

- Keep route components in `src/pages/`.
- Keep static assets in `public/`.
- Keep metadata explicit (`<title>`, viewport, icon links).
- Favor progressive enhancement; avoid unnecessary client-side JS for static pages.

## Change Scope and Safety

- Do not commit generated artifacts: `dist/`, `.astro/`, `node_modules/`.
- Respect `.gitignore` and env-file exclusions.
- If tooling changes (lint, tests, scripts), update this file with exact commands.
- If a test framework is added, include both full-suite and single-test commands.

## Maintenance Note

This repository is currently a minimal Astro starter. Revisit this file whenever workflow, CI, linting, testing, or agent policy files change.
