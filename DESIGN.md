# Brewmate — Design Document

> A walkable 3D café companion. The café **is** the interface — not a chatbot.

**Hackathon:** Builder Pop-Up — "The Café Companion"
**Mandatory tech:** Google Cloud Run (hosting) · Gemini APIs (intelligence)
**Stack:** Next.js 14 (App Router) · Three.js via `@react-three/fiber` + `drei` · TypeScript
**GCP project:** `manim-461406` (project number `886440887604`)

---

## 1. The core bet

Every other team will build a chat box: "What can I get you today?" We flip it.
In Brewmate, **the room is the UI**. You explore a 3D café, objects react to you, and
ambient signals (light, crowd, steam) carry the information a chatbot would otherwise
type at you. Gemini is embodied as a **barista mascot**, not a text thread.

This directly answers the brief's "Surprise us" and the explicit constraint:
*not a chat interface — more creative and unique.*

---

## 2. How it maps to the problem statement

| Brief theme            | Brewmate expression                                                        | Powered by            |
| ---------------------- | -------------------------------------------------------------------------- | --------------------- |
| Smarter Ordering       | Floating 3D drink cards; the pick for *you* glows and drifts forward       | Gemini `/api/recommend` |
| Better Waits           | Your order physically travels counter → pickup shelf with a steam trail    | Gemini `/api/eta`     |
| Discovery              | Time/mood-aware recommendation surfaced spatially, not as a list           | Gemini `/api/recommend` |
| Connect People         | Tables show anonymized shared-interest motes; tap to send an AI icebreaker | Gemini `/api/icebreaker` |
| Understand the Room    | Room light color = live sentiment; crowd density = occupancy; staff god-view | Gemini `/api/room`  |

---

## 3. Two views, one world

```
                        ┌─────────────────────────────┐
                        │        Brewmate world         │
                        └─────────────────────────────┘
                           /                        \
          Customer view (first-person)        Staff view ("god view", top-down)
          ────────────────────────────        ──────────────────────────────────
          • Walk/pan the café                 • Overhead map of the same room
          • Mascot greets + recommends        • Sentiment lighting heatmap
          • Floating menu, glowing pick       • Busy prediction + avg wait
          • Order → steam trail → shelf       • Gemini staff brief (what to do now)
          • Table interest motes + icebreaker • Orders in flight
```

- **Customer** (`/` → "Enter the café"): first-person spatial experience.
- **Staff** (`/staff`): operational dashboard rendered as the *same room* from above.

---

## 4. Architecture

```
Browser (Three.js scene, R3F)
   │  fetch() JSON
   ▼
Next.js App Router (Node runtime) ── on Cloud Run (containerized, standalone output)
   │  server-side only
   ▼
Gemini API (@google/generative-ai, responseMimeType: application/json)
   │  on failure / no key
   ▼
Deterministic mock fallback (src/lib/cafe.ts)
```

Key properties:
- **Gemini is called only server-side** in API routes. The key never reaches the browser.
- **Graceful degradation**: if `GEMINI_API_KEY` is unset or a call fails, every route
  returns realistic mock data and tags the response `source: "mock"`. The app is always
  demoable, even offline.
- **Standalone output** (`next.config.js`) keeps the Cloud Run image small.

---

## 5. File map

```
src/
  app/
    layout.tsx            Root layout
    globals.css           Shared styles / HUD
    page.tsx              Landing + customer 3D café (client)
    staff/page.tsx        Staff god-view dashboard (client)
    api/
      recommend/route.ts  POST — personalized "today's pick"
      eta/route.ts        POST — wait estimate + mascot narration
      room/route.ts       GET  — occupancy/sentiment + staff brief
      icebreaker/route.ts POST — shared-interest opener
      health/route.ts     GET  — Cloud Run health + gemini mode
  lib/
    cafe.ts               MENU, RoomState types, mockRoomState()
    gemini.ts             geminiAvailable(), geminiJson() + fallback
```

---

## 6. Data flow — ordering a drink

1. Customer enters the café (client scene mounts).
2. Client POSTs `{ hour, mood, history }` to `/api/recommend`.
3. Route builds a Gemini prompt from the live menu; asks for `{ drinkId, reason }` as JSON.
4. If Gemini answers and the `drinkId` is valid → `source: "gemini"`; else heuristic mock.
5. The matching 3D drink card **glows and drifts** toward the camera; the mascot speaks the reason.
6. Customer taps the card → client POSTs `{ drinkId }` to `/api/eta`.
7. Route returns `{ minutes, narration }`; a cup spawns and animates counter → shelf over the ETA.

---

## 7. Gemini prompt specs

All prompts force JSON via `generationConfig.responseMimeType = "application/json"`.

- **Recommend** — inputs: local hour, mood hint, order history, full menu.
  Rules: lower caffeine after 15:00; avoid repeating last order; one-sentence reason ≤18 words.
  Output: `{ "drinkId": string, "reason": string }`.
- **ETA** — inputs: current avg wait, occupancy %, drink id.
  Output: `{ "minutes": number (1–20), "narration": string ≤14 words }`.
- **Room brief** — inputs: occupancy %, sentiment (−1..1), avg wait.
  Output: `{ "staffBrief": string ≤20 words }` — one actionable instruction.
- **Icebreaker** — inputs: shared interests.
  Output: `{ "line": string ≤16 words }` — warm, low-pressure, no names.

Default model: `gemini-1.5-flash` (fast + cheap for interactive use), overridable via `GEMINI_MODEL`.

---

## 8. Visual + interaction language

- **Light temperature = sentiment.** Warm amber glow when the room is happy; cooler, dimmer
  when sentiment dips. Same lighting rig drives both views.
- **Crowd density = occupancy.** Ambient seated figures appear/disappear with `occupancy`.
- **Steam trail = progress.** Readiness is a moving particle trail, not a progress bar.
- **Motes = shared interests.** Soft floating tags above occupied tables.
- **The mascot is the agent.** It emotes, points at the pick, and "speaks" via a label —
  carrying the conversational role without a chat box.

---

## 9. Cloud Run deployment plan

Target: project `manim-461406`.

```bash
# 1. One-time: enable services
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  cloudbuild.googleapis.com --project manim-461406

# 2. Build + deploy from source (Cloud Build packs the Dockerfile)
gcloud run deploy brewmate \
  --source . \
  --project manim-461406 \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars GEMINI_MODEL=gemini-1.5-flash \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest
```

- `GEMINI_API_KEY` is stored in **Secret Manager** (`gemini-api-key`) and mounted as a
  secret env var — never baked into the image or committed.
- Container listens on `$PORT` (Cloud Run injects it; `next start -p $PORT`).
- `output: "standalone"` → minimal runtime image.
- `/api/health` gives Cloud Run a cheap liveness signal and reports whether Gemini is live or mock.

---

## 10. Why this wins

- Hits **all five** brief themes, not one.
- Satisfies **both** mandatory (Cloud Run) and optional (Gemini) Google tech.
- Honors the hard constraint: **not a chat interface**.
- Always demoable thanks to mock fallback — no "the API key broke on stage" risk.
- The spatial metaphor is genuinely novel: the café's *light and crowd* are the dashboard.

---

## 11. Stretch ideas (post-MVP)

- Real weather API to bias recommendations (hot day → iced drinks drift forward).
- WebSocket room state so customer + staff views update live together.
- Voice-in via Web Speech API feeding the mascot (still spatial, still non-chat).
- Loyalty: returning customers' past picks pre-glow on arrival.
