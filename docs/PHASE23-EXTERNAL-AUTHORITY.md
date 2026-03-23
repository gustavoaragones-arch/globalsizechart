# Phase 23 — External authority seeding (“dominance layer”)

## Goal

Support **off-site** credibility (Reddit, Quora, forums) with **consistent, accurate** copy that points to canonical URLs—without replacing **on-site** SEO. AI systems often cross-check entities across the public web; this phase gives you **ready-made answers** and a clear **entity page**.

## Deliverables

| Item | Path |
|------|------|
| Seed packs (combined) | `authority/seed-content/reddit-answers.md`, `quora-answers.md` |
| Per-page exports | `authority/generated/reddit/*.md`, `authority/generated/quora/*.md` |
| Strategies | `authority/REDDIT-STRATEGY.md`, `authority/QUORA-STRATEGY.md` |
| Tracker (dashboard) | `data/authority-tracker.json` (mirror: `scripts/authority-tracker.json`) |
| Entity page | `/about-globalsizechart.html` |
| Embed widget | `/widget/` (`widget/index.html`) |
| Org `sameAs` inject | `scripts/inject-authority-org-schema.js` (edit Reddit/Quora URLs first) |
| Footer → AI index | `scripts/inject-ai-footer-link.js` |

## Commands

```bash
# Generate Markdown (default MAX_SEED=100; increase for full programmatic set)
npm run authority:seed
MAX_SEED=756 npm run authority:seed

# After replacing REPLACE_* URLs in inject-authority-org-schema.js:
npm run authority:inject-org

# Footer link to /ai/ (relative paths)
npm run authority:inject-footer

# All three
npm run build:authority
```

## Posting cadence

- Target **3–5** helpful answers per day (Reddit + Quora **combined**), adapted from templates—not copy-pasted verbatim.
- Reddit: **no links** in weeks 1–2; links on **~20–30%** of posts after that.
- Quora: substantive answers **with** canonical link.

## Widget embed

```html
<iframe
  src="https://globalsizechart.com/widget/"
  title="GlobalSizeChart size tools"
  width="340"
  height="220"
  loading="lazy"
  style="border:0;"
></iframe>
```

## Placeholders

Replace `REPLACE_WITH_YOUR_REDDIT_USERNAME` and `REPLACE_WITH_YOUR_QUORA_PROFILE` in:

- `scripts/inject-authority-org-schema.js`
- `about-globalsizechart.html` (entity `sameAs`)

Then re-run `authority:inject-org` if needed.
