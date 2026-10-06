---
name: Gemini access
description: Provider setup decision for TraceFixer AI.
---

TraceFixer uses the official Google GenAI SDK with the project secret `GEMINI_API_KEY`. Do not retry Replit AI Integrations setup unless the user asks; they declined its required upgrade and chose to use their own Gemini key.

**Why:** The Replit integration setup required an upgrade that the user declined.

**How to apply:** Keep Gemini calls server-side and read the key from the environment only. Never reveal, log, or request the key in chat.
