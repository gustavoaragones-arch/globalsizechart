# Cloudflare — bots & AI crawler policy (optional)

Use alongside **Cache Rules** in `cache-rules.md`.

## Security → Bots (plan-dependent)

Goals:

- Reduce bandwidth from **abusive AI scrapers** and **unknown aggressive crawlers**.
- Keep **search** and **allowed AI** crawlers reachable.

### Suggested stance

1. Enable **Bot Fight Mode** or **Super Bot Fight Mode** (per your plan).
2. In **Tools** / **WAF** / **Rate limiting**, add limits for suspicious paths if needed.
3. Use **IP Access Rules** or **Firewall Rules** only for known bad ASNs if you have evidence of abuse.

### Allow / verify (examples)

Ensure these can reach the site (for **SEO** and **AI citation** products):

| User-agent | Purpose |
|------------|---------|
| **Googlebot** | Google Search |
| **Bingbot** | Bing |
| **OAI-SearchBot** | OpenAI search / discovery |

`robots.txt` in this repo allows `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, and standard crawlers — align **WAF** so you are not **blocking** these at IP level by mistake.

### Block / challenge

- Known **spam** or **scraper** patterns (custom WAF rules).
- **Aggressive** unknown bots (rate limit + challenge), not a blanket block of all “AI” without review.

> Blocking “all AI” at Cloudflare can hurt **OAI-SearchBot** and similar; prefer **robots.txt** + **cache rules** + **selective WAF** on abusive IPs.
