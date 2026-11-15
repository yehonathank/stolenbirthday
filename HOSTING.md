# Hosting on free GitHub Pages

## Target

| Item | Value |
| --- | --- |
| Site type | Project site |
| Repo name | `stolenbirthday` (must match URL path) |
| URL | `https://USERNAME.github.io/stolenbirthday/` |
| Visibility | Public repository (required on Free) |
| Publish | `main` branch, `/` root |

## Free limits (official)

| Limit | Detail |
| --- | --- |
| Published site | Max **1 GB** |
| Source repo | Recommended **≤ 1 GB** |
| Single file | Git blocks **> 100 MiB** (warn ~50 MiB; browser upload max 25 MiB) |
| Bandwidth | Soft **~100 GB / month** |
| Builds | Soft **10 / hour** from branch deploy (not custom Actions) |
| Deploy timeout | **10 minutes** |
| Runtime | Static only |

Policy: Pages is not for e-commerce, SaaS, or capturing sensitive payments. A film promo site is fine.

Docs: [About Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages) · [Limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)

## Media policy

- Embed the trailer (YouTube / Vimeo). Do not put large video in the repo.
- Do not use Git LFS for files the live site must serve.
- Compress stills; host heavy press packs off-repo and link out.

## If you hit a limit

| Problem | Paths that stay free (or cheap) |
| --- | --- |
| Large video | YouTube/Vimeo embed; or short clip on R2/Bunny/S3 + CDN |
| Huge images / ZIP | Compress/WebP; Drive / Dropbox / WeTransfer link |
| Site size growing | Delete unused assets; lazy-load; move archive off-repo |
| Bandwidth spike | Externalize media; Cloudflare in front of a custom domain |
| Contact / tickets | Formspree, Buttondown, Eventbrite (embed or link) |
| Need private site | Paid GitHub plan, or another host |
| Too many builds | Fewer Pages-triggering pushes, or custom Actions publish |

Leaving GitHub Pages (Cloudflare Pages, Netlify, etc.) only with an explicit decision to change hosts.

## Custom domain (optional)

Settings → Pages → Custom domain → Save → enable **Enforce HTTPS** after DNS verifies.
