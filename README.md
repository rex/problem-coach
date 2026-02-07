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
2. Run the app:
   ```bash
   npm run dev
   ```
3. Open http://localhost:3000

You can also use the Makefile:
```bash
make setup
make dev
```

## Usage
1. Enter your problem description.
2. Paste your OpenAI API key (starts with `sk-`).
3. Optionally enable “Remember API key” (stored in localStorage only).
4. Click **Start Deep Dive** to run the pipeline.

### Model Override
The model field defaults to `gpt-5`. Advanced users can enter a different model ID (e.g., `gpt-4.1` or similar) if their account supports it.

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
- **Empty output**: the app falls back to raw text if JSON parsing fails.
- **CORS or network issues**: the request is routed through the Next.js API route, so make sure the server is running.

## Exporting to Markdown
Use the **Export Markdown** button in the results header or the session history list. The download includes all completed steps with bullets, actions, and open questions.

## Exporting to JSON
Use the **Export JSON** button in the results header or the session history list. The download includes the full session object, step metadata, and outputs.

## Security Notes
Your API key is stored only in your browser when “Remember API key” is enabled. It is sent to the server route on each call in order to reach the OpenAI API.

## Development Notes
- App Router is used (`app/` directory).
- Tailwind CSS handles styling and animations.
- Responses API calls live in `app/api/run-step/route.ts`.
