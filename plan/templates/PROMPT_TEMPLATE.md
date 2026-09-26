# Prompt: {name}.v{N}

**Role:** extractor | interim | assessor | planner | summary
**Model config key:** {PLANNER_MODEL / …}
**Latency budget:** {ms}
**Temperature:** {0–0.4}

## System
{text}

## User template
{text with {placeholders}}

## Output JSON schema
```json
{ }
```

## Code-side validation
- {e.g. every quote must be a substring of the input transcript}

## Eval cases (`apps/api/tests/evals/{name}/`)
| Case | Input summary | Expected |
|---|---|---|
| 1 | | |

## Changelog
- v{N} ({date}): {change} → eval result {x/y}
