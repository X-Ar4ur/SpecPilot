# SpecPilot

SpecPilot is a local full-stack system for generating and executing manual-driven web test scenarios for 4ga Boards.

The source requirements are in `项目需求.md`. The architecture blueprint is in `PLANv2.md`. Agentic workers must read `AGENTS.md` before implementation.

## MVP Stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, Radix UI, Lucide Icons, React Flow, TanStack Query, Zustand, Recharts.
- Backend: FastAPI, SQLModel, SQLite, ChromaDB, LangGraph.
- Browser execution: browser-use only.
- Text LLM: DeepSeek V4 Pro (`deepseek-v4-pro`) via `langchain-deepseek` by default.
- Optional text LLM: Browser Use hosted LLM via `BROWSER_USE_API_KEY`, when explicitly selected.
- Vision verification: GLM-4.6V via backend adapter.

## Repository Layout

The implementation plan expects this structure:

```text
frontend/                  Next.js App Router console
backend/                   FastAPI service and agent workflow
docs/                      Requirements, specs, API, schemas, prompts, tests
data/                      Local runtime data, ignored by git
artifacts/                 Optional exported reports, ignored by git
image/                     Existing project assets
```

## Local Environment

Create a `.env` file from `.env.example` before running the app.

The exact setup commands are defined milestone by milestone in `docs/IMPLEMENTATION_PLAN.md`. Do not install extra major frameworks unless the implementation plan is updated first.

## Agent Handoff

When using Codex or Claude to implement this project, prompt it with:

```text
Read AGENTS.md first, then follow docs/IMPLEMENTATION_PLAN.md milestone by milestone.
Implement only the milestone I request. Do not use Playwright. Use browser-use as the only executor. Keep scenarios zero-locator.
```
