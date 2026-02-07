# AGENTS.md

This document is a complete handoff for future agents working in this repo.

## 1) Project Overview
Problem Coach is a single-page Next.js app that runs a fixed, multi-step analysis pipeline against a user’s problem statement. Each step is an independent OpenAI API call, enabling deep, structured output without cramming everything into one response.

Primary user goals:
- Break a messy problem into structured, prioritized actions.
- Get creative solution pathways, physical environment suggestions, and AI leverage ideas.
- Persist inputs and outputs locally for later review.

## 2) Architecture & Data Flow

### High-level flow
1. User enters a problem + API key.
2. Client creates a new session object and runs pipeline steps sequentially.
3. For each step, the client calls `POST /api/run-step`.
4. The server route calls the OpenAI Responses API and returns structured JSON.
5. Client persists results to local storage and updates the UI.

### Key files
- `app/page.tsx`: client orchestration and UI state.
- `app/api/run-step/route.ts`: OpenAI API integration.
- `lib/pipeline.ts`: step definitions, prompt construction, schema helpers.
- `lib/storage.ts`: localStorage helper functions.
- `lib/types.ts`: shared types.
- `components/`: UI primitives.
- `components/SessionHistory.tsx`: saved sessions list + export/delete controls.
- `lib/export.ts`: markdown export helpers.

## 3) Pipeline Definition
Defined in `lib/pipeline.ts`.

Step order:
1. `distill`
2. `constraints`
3. `breakdown`
4. `prioritize`
5. `solutions`
6. `physical`
7. `ai_leverage`
8. `plan`

Each step uses:
- `STEP_META`: title, subtitle, and focus guidance.
- `buildStepPrompt`: includes the problem plus a compact summary of prior outputs.
- `STEP_OUTPUT_SCHEMA`: JSON schema enforced by the OpenAI Responses API.

## 4) API Route Behavior
`POST /api/run-step`

### Request
```json
{
  "apiKey": "sk-...",
  "model": "gpt-5",
  "stepId": "distill",
  "problem": "...",
  "context": {
    "distill": {"title": "...", "summary": "...", "bullets": [], "actions": [], "questions": []}
  }
}
```

### Response
```json
{
  "stepId": "distill",
  "ok": true,
  "output": {
    "title": "...",
    "summary": "...",
    "bullets": ["..."],
    "actions": ["..."],
    "questions": ["..."]
  }
}
```

### Error handling
- Missing fields → 400
- Unknown step → 400
- OpenAI errors → 500
- JSON parse failure → returns a normalized `StepOutput` with `summary` containing the raw text

## 5) Local Storage Schema
- `pc_api_key`: OpenAI API key (only if user opts in)
- `pc_sessions`: array of session objects
- `pc_last_session_id`: ID of the most recent session

## 6) Markdown Export
Markdown export is generated client-side in `lib/export.ts`. It includes the problem statement and each step’s summary, bullets, actions, and open questions. Downloads are initiated via a blob URL in the browser.

## 7) JSON Export
JSON export is generated client-side in `lib/export.ts` and contains the full session object with step timings, statuses, and outputs.

## 6) UI Design Rules
Dark mode is the default and only mode.

Design signals to preserve:
- High-contrast dark gradients
- Soft neon accent (`emerald` and `ember` tones)
- Space Grotesk as primary font, IBM Plex Mono as secondary
- Staggered reveal animation on result cards
- Rounded cards with subtle border and glow

## 7) Extending the Pipeline
To add a new step:
1. Add it to `StepId` in `lib/types.ts`.
2. Insert it in `STEP_ORDER` in `lib/pipeline.ts`.
3. Add metadata in `STEP_META`.
4. Update any UI logic that assumes `STEP_ORDER.length`.

The client will automatically render a new step in the progress rail and results list.

## 8) Session History
`components/SessionHistory.tsx` renders saved sessions from `pc_sessions`. It supports loading, exporting, and deleting sessions. Deleting the active session loads the newest remaining session (if any).

## 9) Step Utilities
- Copy-to-clipboard: each result card can copy a formatted block of text for the step.
- Expand/Collapse: result cards can be collapsed to summary-only view.
- Timings: each step stores `startedAt`, `finishedAt`, and `durationMs` when run.

## 10) Debugging Checklist
- Check that `apiKey`, `problem`, and `stepId` are present in request payloads.
- Verify model access for the key (model mismatch is the most common error).
- Confirm local storage is available (not blocked by browser settings).
- Use the progress rail to identify which step fails.

## 11) Conventions
- Use `STEP_ORDER` as the source of truth for ordering and iteration.
- Keep prompts concise and explicit.
- Avoid leaking non-JSON output from the OpenAI responses.
- Persist the session after each step so a refresh does not lose progress.
