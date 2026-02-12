# Problem Coach

A dark-mode, single-page Next.js app that runs a multi-step AI pipeline to unpack a messy problem, prioritize the work, generate solutions, suggest physical environment changes, and produce an action plan. Each step is its own API call, so you get depth without hitting response limits.

## Features
- Fixed, multi-step analysis pipeline
- Separate API calls per step with visible status
- Full local persistence of inputs and outputs
- Session history with quick load/delete/export
- Export any session to Markdown
- Export any session to JSON
- Per-step expand/collapse and copy-to-clipboard
- Step timing displayed in the pipeline
- Dark-mode, high-contrast UI with motion
- OpenAI Responses API integration via server route

## Quick Start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Optional: add your API key to `.env.local` so you do not have to enter it in the UI:
   ```bash
   cp .env.example .env.local
   ```
   Then set `OPENAI_API_KEY` in `.env.local`.
3. Run the app:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000

You can also use the Makefile:
```bash
make setup
make dev
```

## Usage
1. Enter your problem description.
2. Provide an OpenAI API key in one of two ways:
   - Set `OPENAI_API_KEY` in `.env.local` (preferred for local development), or
   - Paste a key in the UI field.
3. Optionally enable “Remember API key” to store the UI key in localStorage.
4. Click **Start Deep Dive** to run the pipeline.

### Model Selection
The model picker is a dropdown populated from your account-accessible OpenAI models (filtered to text models suitable for this pipeline). If model lookup fails, the app falls back to a safe default list.

## Pipeline Steps
1. Distill: clarify and restate the core problem.
2. Constraints: identify blockers, risks, and root causes.
3. Breakdown: compartmentalize into domains and sub-problems.
4. Prioritize: order work by impact and urgency.
5. Solutions: creative pathways for top priorities.
6. Physical: tangible changes to environment and organization.
7. AI Leverage: how to use AI across compartments.
8. Action Plan: a short, ordered plan with next actions.

Each step returns strict JSON:
```json
{
  "title": "...",
  "summary": "...",
  "bullets": ["..."],
  "actions": ["..."],
  "questions": ["..."]
}
```

## Local Storage
- `pc_api_key`: optional stored API key
- `pc_sessions`: array of all sessions
- `pc_last_session_id`: pointer to the active session

To reset everything, clear your browser’s local storage for this site.

## Troubleshooting
- **API errors**: ensure your API key is valid and has access to the model you entered.
- **Missing API key**: add `OPENAI_API_KEY` to `.env.local` or enter a key in the UI.
- **Empty output**: the app falls back to raw text if JSON parsing fails.
- **CORS or network issues**: the request is routed through the Next.js API route, so make sure the server is running.

## Exporting to Markdown
Use the **Export Markdown** button in the results header or the session history list. The download includes all completed steps with bullets, actions, and open questions.

## Exporting to JSON
Use the **Export JSON** button in the results header or the session history list. The download includes the full session object, step metadata, and outputs.

## Security Notes
If you set `OPENAI_API_KEY` in `.env.local`, it stays server-side and is never exposed to the browser.
If you paste a key into the UI, it is stored only in your browser when “Remember API key” is enabled, and sent to the server route for API calls.

## Development Notes
- App Router is used (`app/` directory).
- Tailwind CSS handles styling and animations.
- Responses API calls live in `app/api/run-step/route.ts`.
- Model discovery lives in `app/api/models/route.ts`.
