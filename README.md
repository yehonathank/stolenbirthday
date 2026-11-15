# Stolen Birthday

Lightweight film site, hosted free on **GitHub Pages** as a project site:

`https://USERNAME.github.io/stolenbirthday/`

Replace `USERNAME` with the GitHub account or org that owns the repo.

## Stack

- Static HTML / CSS / JS only (no server runtime)
- Publish from the `main` branch, site root `/`
- `.nojekyll` so GitHub does not run Jekyll on this site

## Brand & design tokens

- **Single source of truth:** [`css/tokens.css`](css/tokens.css) — colors, type, space, radius, motion, layout, logo path
- **Fonts:** Cormorant Garamond (UI) + Cedarville Cursive (“Coming Soon…” only)
- **Look:** pure black field, sharp frames, stills-sampled warm palette + chartreuse accents
- **Visual guidelines:** local [`brand/index.html`](brand/index.html) (gitignored — open locally; not published to Pages)
- Site CSS must use `var(--…)` only; edit look & feel in `tokens.css`, not scattered hex values
- Cursor rule: [`.cursor/rules/brand-guidelines.mdc`](.cursor/rules/brand-guidelines.mdc)

## License

**All Rights Reserved** — see [LICENSE](LICENSE). In the GitHub “Add a license” picker, choose **None** (do not pick MIT/Apache/GPL); this repo already includes a proprietary license because it holds film branding and creative assets.

## Enable Pages (GitHub UI)

1. Create a **public** repository named exactly `stolenbirthday`.
2. Push this project to that repo.
3. Repo **Settings → Pages**.
4. **Build and deployment → Source**: Deploy from a branch.
5. **Branch**: `main`, folder `/ (root)` → Save.
6. Open the URL shown under Pages (first deploy can take a few minutes).

## Free-tier guardrails

Cursor rules in `.cursor/rules/` keep work inside free Pages limits (size, bandwidth, static-only). Agents must warn before overstepping and suggest fallbacks (e.g. YouTube/Vimeo for the trailer, off-repo press kits).

See [HOSTING.md](HOSTING.md) for limits and alternatives.

## Folder structure

```
/
├── index.html          # Home (Pages entry)
├── brand/              # Local guidelines only (gitignored)
├── css/
│   ├── tokens.css      # Design tokens (edit here)
│   └── styles.css      # Site styles (var(--…) only)
├── js/main.js
├── assets/
│   ├── brand/          # Logo, wordmark, favicon
│   ├── hero/           # Homepage key art
│   ├── stills/         # Film stills
│   ├── cast/           # Cast / crew photos
│   ├── leadership/     # Directors / producers / leadership
│   ├── posters/        # Poster art
│   └── press/          # Small web-ready press images only
├── HOSTING.md
├── LICENSE
└── .nojekyll
```

See [assets/README.md](assets/README.md) for what to drop where. Use relative paths (e.g. `assets/hero/…`) so the site works under `/stolenbirthday/`.

## Local preview

Open `index.html` in a browser, or serve the folder with any static file server.
