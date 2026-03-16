# CUResearch.ai Frontend MVP

This frontend replaces Swagger as the real interaction entry for the research workspace MVP.

Current scope:

- Workspace page for workflow discovery and creation
- Research Studio page with `Sources / Chat / Outputs`
- Real FastAPI integration by default
- Mock fallback for selected read APIs when the backend is unavailable
- Manual `asset_structurer` skill trigger for individual sources

Current limitations:

- LLM behavior still depends on the backend mock client
- Plan / Outline are structured placeholders in this version
- Workflow task/source metrics are frontend mock indicators

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router

## Install

```bash
cd /Users/minhaoliu/Desktop/project/SparkHunter/frontend
npm install
```

## Configure API Base URL

Create `.env` from the example:

```bash
cp .env.example .env
```

Default:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Recommended local setup:

- Backend: `http://127.0.0.1:8000`
- Frontend: `http://127.0.0.1:5173`

## Run

```bash
npm run dev
```

Open:

- [http://127.0.0.1:5173](http://127.0.0.1:5173)

## Build

```bash
npm run build
```

## Page Structure

### Workspace

- Top navigation with product identity
- User settings drawer in the top-right corner
- Stage filter tabs
- Workflow cards
- Create / edit / delete workflow modal flow

### Research Studio

- Left: workflow overview and source assets
- Center: diagnostic chat workspace
- Right: tasks, notes, plan, and outline tabs

### Source Structuring

Each selected asset in the left panel now exposes a `Structure Source` action:

- Runs backend skill `asset_structurer` for that one source
- Inserts a readable structured assistant card into chat
- Generates or updates a workflow note as long-term memory
- Keeps raw `metadata_json` internal; users do not read raw JSON in the UI

## Project Structure

```text
frontend/
  src/
    app/
    pages/
    components/
    services/
    hooks/
    types/
    utils/
    styles/
```

Key rules in this codebase:

- API calls stay in `services/`
- Stateful page logic stays in `hooks/`
- Components remain mostly presentational
- Shared UI primitives stay in `components/common`

## Backend Compatibility

Expected backend API envelope:

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

Integrated endpoints:

- `/api/workflows`
- `/api/assets`
- `/api/assets/upload`
- `/api/chat/history/{workflow_id}`
- `/api/chat/send`
- `/api/tasks`
- `/api/notes`

Research runs are typed in `services/` and `types/`, but not yet exposed in the main UI.

## Settings And Model Configuration

The top-right `Settings` drawer contains three sections:

- `Profile`: display name, role/title, organization, default project id
- `Workspace Preferences`: persistent default chat mode
- `Model Settings`: provider, model, base URL, API key, temperature, timeout, and connection testing

Supported provider labels:

- OpenAI
- Gemini
- Qwen
- MiniMax
- Kimi
- Custom OpenAI-compatible

Important behavior:

- The frontend sends model settings to the backend settings API and does not keep API keys in `localStorage`
- The backend persists these settings for the current single-user MVP profile
- The Studio chat header still includes a `Mock / Live` toggle, but that is only a session override
- The drawer's `default chat mode` is the persistent default used when Studio opens without a session override

## Future Extensions

- Add research-runs panel and timeline
- Turn Plan / Outline into real structured outputs
- Richer source preview for PDF / text / code
- Persist chat-derived suggested tasks beyond the current session
