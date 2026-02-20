# Cloudflare Pages – GitHub connection

The live site **globalsizechart.com** is hosted on Cloudflare Pages. For pushes to GitHub to update the site, the Pages project must use **Git** (GitHub) as the source.

## If the project was created with Direct Upload (manual)

You cannot add Git to an existing Direct Upload project. Create a **new** Pages project and choose **Connect to Git** → GitHub, then select this repo and branch (`main`). After the first deploy, add your custom domain (globalsizechart.com) in the new project and update DNS if needed.

## Connect this repo to Cloudflare Pages (Git)

1. **Cloudflare Dashboard** → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Authorize the **Cloudflare Workers & Pages** GitHub App if prompted.
3. Select repository: **gustavoaragones-arch/globalsizechart** (or your fork).
4. **Production branch:** `main`.
5. **Build settings** (static site, no build):
   - **Framework preset:** None (or “Static HTML” if available).
   - **Build command:** leave empty or `exit 0`.
   - **Build output directory:** leave empty (root) or `/`.
6. **Save and Deploy.**

After this, every push to `main` triggers a new deployment. The three controlled improvements (header, typography, validation) will appear once a deploy has run.

## Custom domain

In the Pages project: **Custom domains** → add **globalsizechart.com** (and www if you use it). Cloudflare will show the required DNS records (CNAME or A/AAAA).

## Skip a deployment

In a commit message use: `[CF-Pages-Skip]` or `[Skip CI]` so that push does not trigger a build.
