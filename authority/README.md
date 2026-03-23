# External authority seeding (Phase 23)

This folder supports **off-site** presence (Reddit, Quora, etc.) with consistent, accurate copy that points to canonical GlobalSizeChart URLs.

| Path | Purpose |
|------|---------|
| `seed-content/reddit-answers.md` | Combined Reddit-style Q&A (batch export) |
| `seed-content/quora-answers.md` | Combined Quora-style Q&A |
| `generated/reddit/` | One Markdown file per conversion (Reddit tone) |
| `generated/quora/` | One Markdown file per conversion (Quora tone) |
| `REDDIT-STRATEGY.md` | Subreddits + posting cadence |
| `QUORA-STRATEGY.md` | Quora format + links |

**Generate / refresh:**

```bash
npm run authority:seed
# Full programmatic set:
MAX_SEED=2000 npm run authority:seed
```

**Dashboard:** manually append posts to `data/authority-tracker.json`.

**Consistency:** aim for **3–5** helpful answers per day (Reddit + Quora combined), quality over volume.
