# 🍄 People's Game

Mario 3-themed Kahoot-style icebreaker for professional networking. Hackathon build.

## How It Works

1. Host opens `/host` on a laptop/projector → 4-letter code + QR.
2. Players scan QR or enter the code on their phones.
3. Each player fills a quick profile: role, hobby, fun fact.
4. Trivia rounds — multiple-choice "Whose hobby is X?" questions. Speed = bigger 🪙 score.
5. Group challenge — auto-assigned to World 1/2/3 teams, huddle in real life, submit a group answer.
6. Final leaderboard.

## Stack
- Frontend: Preact + TypeScript + Vite + Tailwind (Mario 3 styling)
- Backend: Node + Express + TypeScript (in-memory state, polling-based)

## Local Dev
```bash
cd backend && npm install && npm run dev   # port 3001
cd frontend && npm install && npm run dev  # port 5173
```
Vite proxies `/api` → backend.

## Deploy
- Frontend → Vercel (use `frontend/` as root; set `VITE_API_BASE` env var)
- Backend → Render (uses included `render.yaml`)
