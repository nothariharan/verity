# Verity

**Resumes make claims. Verity checks them, out loud.**

![An open case file: a ring on one page, a waveform on the other](docs/assets/verity-hero.png)

Verity is a voice interviewer. Each line on a resume becomes a case with three hypotheses — **Owned**, **Contributed**, and **Surface** — and Verity asks the question that best separates the two that are still tied. When the belief moves, the dossier keeps a receipt: the quote, the audio clip, and the reason. Recruiters get that record. They do not get a score.

Built for the BNB International Hackathon, AI/ML track.

## Run it

Node 22 or newer, and pnpm 10.

```bash
pnpm install
cp .env.example .env
pnpm dev:fake
```

`pnpm dev:fake` runs speech and the language model offline. `pnpm dev` uses the keys in `.env` (ElevenLabs for voice, Gemini with an OpenAI fallback). The site is [http://localhost:3000](http://localhost:3000). The realtime server is [http://localhost:8787](http://localhost:8787).

| Path | Who it's for |
|---|---|
| `/` | Landing |
| `/app` | Hiring board. Create an interview, watch it, open the dossier |
| `/interview/[id]` | The candidate's room |
| `/me` | Practice on your own resume |

Copy `.env.example` and fill it in locally. `.env` is gitignored. Interview audio and the SQLite log stay in `apps/server/data/`, which is also gitignored.

## What's in the repo

| Path | What it is |
|---|---|
| `apps/web` | Next.js app: landing, interview room, dashboards, dossier |
| `apps/server` | Fastify server: sessions, voice, case engine, hash-chained event log |
| `packages/contracts` | Shared event types and the reducer |
| [`plan/`](plan/README.md) | Product spec, architecture, and the phase board |
| [`docs/`](docs/README.md) | Hackathon write-up and pitch notes |
| [`research/`](research/README.md) | Early landscape notes, kept for reference |

`research/` and `MASTER_AI_INTERVIEW_BOT_BLUEPRINT.md` use an earlier working name in places. The product name is Verity.

## Stack

Next.js 16 · React 19 · Node and Fastify WebSockets · zod contracts · Drizzle and SQLite (libSQL) · ElevenLabs Scribe realtime speech-to-text · ElevenLabs Flash text-to-speech · Gemini, with OpenAI as fallback.

The camera is not recorded. Beliefs move from the transcript. A receipt plays a slice of the candidate recording stored next to that interview.
