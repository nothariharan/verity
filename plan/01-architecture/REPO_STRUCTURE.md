# Repository Structure (target)

```
verity/
├── AGENTS.md · CLAUDE.md · GEMINI.md · README.md
├── plan/                         # the plan (source of truth)
├── research/                     # early reference only
├── package.json                  # scripts: dev, dev:fake, test, test:e2e, eval, latency, lint
├── pnpm-workspace.yaml
├── .env.example
├── packages/
│   └── contracts/                # zod schemas → types + JSON Schema
│       ├── src/{domain.ts,events.ts,ws.ts,llm.ts,index.ts}
│       └── test/
├── apps/
│   ├── web/                      # Next.js latest, App Router, Tailwind
│   │   ├── app/
│   │   │   ├── page.tsx                  # setup
│   │   │   ├── interview/[id]/page.tsx   # candidate
│   │   │   ├── board/[id]/page.tsx       # live case board
│   │   │   └── dossier/[id]/page.tsx     # receipts dossier + scrubber
│   │   ├── components/{board,case,receipts,dossier,voice,lens}/
│   │   ├── lib/
│   │   │   ├── socket.ts                 # WS client, reconnect + replay
│   │   │   ├── store.ts                  # event → state reducer (zustand)
│   │   │   ├── audio/{mic-worklet.ts,player-worklet.ts,vad.ts,acks.ts}
│   │   │   └── integrity/{focus.ts,gaze.ts}
│   │   ├── public/audio/acks/*.wav
│   │   └── tests/{unit,e2e}
│   └── server/                   # Fastify + @fastify/websocket
│       ├── src/
│       │   ├── main.ts · config.ts
│       │   ├── http/{sessions.ts,audio.ts,dossier.ts}
│       │   ├── session/{hub.ts,voice-fsm.ts,turns.ts,echo-guard.ts,recorder.ts}
│       │   ├── log/{event-log.ts,chain.ts,projections.ts,rebuild.ts}
│       │   ├── mind/{extractor.ts,assessor.ts,live-eval.ts,drafter.ts,policy.ts,belief.ts,ledger.ts,prompts/}
│       │   ├── providers/{stt,tts,llm}/{index.ts,real.ts,fake.ts}
│       │   ├── ingest/pdf.ts
│       │   ├── integrity/audio-signals.ts
│       │   └── dossier/build.ts
│       ├── data/                 # sqlite + audio (gitignored)
│       └── tests/{unit,integration,evals,latency}
└── fixtures/                     # demo resume/JD, scripted answers, fake provider scripts, event logs
```

## `.env.example`
```
PROVIDERS=fake                    # fake | real (per-provider overrides below)
STT_PROVIDER=deepgram
DEEPGRAM_API_KEY=
DEEPGRAM_MODEL=flux               # or nova-3
TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
ELEVENLABS_MODEL_ID=eleven_flash_v2_5
TTS_CLAUSE_STREAMING=false
LLM_PROVIDER=groq
GROQ_API_KEY=
MODEL_EXTRACTOR=
MODEL_ASSESSOR=
MODEL_LIVE=
MODEL_DRAFTER=
DATABASE_URL=file:./data/verity.db
PORT=8787
NEXT_PUBLIC_SERVER_URL=http://localhost:8787
NEXT_PUBLIC_ENABLE_LENS=false
```
