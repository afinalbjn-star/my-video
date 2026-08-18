# AGENTS.md - my-video Remotion Project

> Compact instruction file for OpenCode sessions. Every line answers: "Would an agent likely miss this without help?"

## Commands

| Action | Command |
|--------|---------|
| Install dependencies | `npm i` |
| Start preview/dev server | `npm run dev` (alias: `remotion studio`) |
| Lint (ESLint + TypeScript) | `npm run lint` |
| Type-check only | `npx tsc --noEmit` |
| Build bundle | `npm run build` (`remotion bundle src/index.tsx`) |
| Render single composition | `npx remotion render src/entry.tsx <COMP_ID> out/<COMP_ID>.mp4` |
| Render all compositions | `npm run render-all` |
| Render underwater bubbles | `npm run render-underwater-bubbles` |
| Render specific scene | `npm run render-<scene-name>` (e.g. `npm run render-underwater-bubbles`) |
| Run all tests (tsx) | `npx tsx test-*.ts` (individual: test-bluesmind, test-simple-agent, test-fixes, test-multi-agent-system) |
| AI agent workflow | `npx tsx run-ai-agent.ts` |
| Desktop electron | `npm run desktop` |
| Upgrade Remotion | `npm run upgrade` (`remotion upgrade`) |

## Build / Lint / Test Order

**Always run in this order** to catch issues early:

1. `npm run lint` (ESLint + Type type-check)
2. `npx tsc --noEmit` (full type-check; filters to new component only via `agent-controller.ts` logic)
3. `npx tsx test-*.ts` (run test scripts)

**Why**: Lint catches style/bugs first; type-check validates correctness; tests verify logic. Running reverse order may mask lint errors as type errors, or vice versa.

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `src/` | Main source code — all Remotion components, scenes, and the AI agent system |
| `src/agent/` | Multi-agent architecture: `agent-controller.ts` (orchestrates video creation), `multi-agent/` (specialist agents, coordinator), `universal-agent.ts` |
| `src/lib/bluesmind.ts` | Bluesmind API client — OpenAI-compatible chat completions with model fallback chain, circuit breaker, exponential backoff |
| `src/Root.tsx` | Defines all `<Composition>` entries — **auto-detected by GitHub Actions render.yml** when no compositionId is specified |
| `src/entry.tsx` | Registers `RemotionRoot` via `registerRoot()` |
| `.env` | Required env vars: `BLUESMIND_API_KEY`, `BLUESMIND_API_BASE_URL`, `GITHUB_TOKEN`, `GITHUB_USERNAME`, `GITHUB_REPO` |
| `.github/workflows/render.yml` | CI workflow: auto-detects compositions from Root.tsx, renders, uploads artifacts. Triggered on push to `main`. |
| `out/` | Render output directory (mp4 files) |
| `public/` | Generated TTS voiceovers (mp3 files) written by AI agent `generateAssets()` |

## Key Conventions & Quirks

- **4K 60fps standard**: Most scenes use `width={3840}, height={2160}, fps={60}`. Some use 1920x1080 or fps={30}.
- **Compositions in Root.tsx**: Every `<Composition>` in `Root.tsx` becomes discoverable by the GitHub Actions workflow (auto-detect mode). Omitting a composition from Root.tsx means it won't be auto-rendered.
- **AI generation validation loop** (`agent-controller.ts:270`): Component code goes through up to 3 attempts of TypeScript validation + director review. If all fail, a fallback template is used (see `getFallbackComponent()`).
- **Fallback component** (`agent-controller.ts:350`): If AI generation fails, uses a 4K 60fps seamless loop template with grid pattern + animated particles. Not aesthetically polished — plan to replace via AI generation.
- **Model fallback chain** (`src/lib/bluesmind.ts:25-29`): Primary model → LLaMA 3.3 70b → Gemma 3 12b. Timeout 180s per request; gateway/timeout errors trigger automatic fallback to next model.
- **Circuit breaker** (`src/lib/bluesmind.ts:57-61`): After 3 consecutive failures, blocks requests for 60s to prevent thundering herd.
- **GitHub Actions render.yml**: On push to `main`, auto-detects compositions from Root.tsx. If you add a new composition, add it to `Root.tsx` first, then push — the workflow will detect it automatically. Or pass `compositionId` via workflow_dispatch input.
- **.gitignore**: Excludes `node_modules`, `out/`, `build/`, `*.log`. Ensure rendered videos and logs are not committed.
- **TypeScript**: `tsconfig.json` includes `src/**/*` but explicitly excludes test files and `src/agent/multi-agent/universal-agent.ts`. Run `npx tsc --noEmit` to check the source tree.
- **Remotion version**: `4.0.503` across all `@remotion/*` packages. Use `npm run upgrade` to upgrade; run `npx remotion upgrade` for CLI upgrade.

## Testing Quirks

- **test-bluesmind.ts**: Validates API connectivity. Requires `BLUESMIND_API_KEY` and `BLUESMIND_API_BASE_URL` in `.env`.
- **test-simple-agent.ts**: Tests AI planning. Requires Bluesmind API creds.
- **test-fixes.ts**: Environment variable validator. Checks GitHub token format (`ghp_` or `github_pat_` prefix).
- **test-multi-agent-system.ts**: Tests the full multi-agent orchestration. Requires all env vars from `.env`.
- All test scripts use `npx tsx <file>` — ensure `tsx` is available (it's in devDependencies).
- **No external services required** for lint/typecheck. Tests require `.env` config.
- **FIXES_GUIDE.md**: Exists at repo root for detailed fix documentation — reference it if agent encounters runtime errors.

## Environment & Setup

- **Copy `.env.example` → `.env`** and fill in values. The `.env` file is the single source of truth for all API keys and GitHub credentials.
- **Required env vars** (from `.env`):
  - `BLUESMIND_API_BASE_URL` — defaults to `https://api.bluesminds.com/v1`
  - `BLUESMIND_API_KEY` — Bluesmind API key (starts with `sk-`)
  - `GITHUB_TOKEN` — GitHub PAT starting with `ghp_` or `github_pat_`
  - `GITHUB_USERNAME` — your GitHub username
  - `GITHUB_REPO` — repo name (e.g. `my-video`)
- **Optional**: `GEMINI_API_KEY`, `GEMINI_MODEL`, `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `CEREBRAS_API_KEY` — for additional AI providers.
- **Never commit `.env`** — it's gitignored. Reference `AGENTS.md` for required vars.

## Architecture Notes

- **Multi-agent system** (`src/agent/multi-agent/`) implements a specialist-agent architecture with:
  - `agent-controller.ts`: Main orchestrator — steps: web research → plan video → generate assets → generate Remotion components (with validation loop) → update Root.tsx → git operations → trigger GitHub Actions render workflow
  - `enhanced-universal-agent.ts`: Extended agent with multi-agent coordination
  - Specialist agents: coordinator, performance monitor, error handler
  - Agent types: plan, generate, refine, git_commit
- **Web research** (`agent-controller.ts:129`): Uses DuckDuckGo lite API autonomously before planning.
- **Git operations** (`agent-controller.ts:638`): Resilient — won't fail the entire process. Commit may succeed even if push fails (no GitHub auth). Workflow trigger requires all three GitHub env vars.
- **Root.tsx auto-update** (`agent-controller.ts:548`): When AI generates a new video, `updateProjectConfig()` automatically adds the new composition to `Root.tsx` via regex replacement. **Verify Root.tsx after AI agent run** to ensure composition was added correctly.
- **Composition detection** (GitHub Actions): `npx remotion compositions src/entry.tsx --props='{}'` — extracts composition IDs from Root.tsx. Falls back to `GoldenNetworkBackground` if none detected.