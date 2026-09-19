# Portfolio — Tactile Maximalism draft

Plain HTML/CSS/JS, no build step. Ready to push to GitHub and serve with GitHub Pages.

## Files

- `index.html` — all content/markup, organized by section (Hero, Work, Experience, Skills, Contact)
- `style.css` — theme (colors, type, layout) — edit `:root` at the top to change the palette
- `script.js` — the three interactive bits: hero mouse parallax, Work-list cursor-follow preview, scroll reveals
- `images/` — placeholder SVGs standing in for your real photos/screenshots. Swap them 1:1, same filenames or update the `src`/`data-img` references.

## What to edit first

1. **Hero** (`index.html`, top of `<body>`): your name, tagline, bio, avatar image. Swap `images/polaroid-*.svg` in `#heroCollage` for real photos of objects/textures — that's your collage.
2. **Work**: each `<li class="work__row">` is one project. `data-img` on the `<li>` sets the image shown in the cursor-follow preview when you hover that row. Duplicate a row to add more (3–5 recommended).
3. **Experience**: each `<li class="experience__item">` is one role, reverse-chronological.
4. **Skills**: each `.skills__cat` block is a category; edit the `<span>` tags inside.
5. **Contact**: update the email, GitHub/LinkedIn/Twitter links, and point `contact__resume` at a real `resume.pdf` you add to this folder.

Search the file for `[X]`, `[City]`, `Your Name`, `yourusername`, `you@example.com` — those are all placeholders.

## Interactions

- **Hero collage**: drifts opposite the cursor (mouse parallax), depth controlled per-item via `data-depth` (0–1). Disabled under 761px width (becomes a static horizontal scroll strip) and for users with reduced-motion enabled.
- **Work rows**: hovering a row shows a trailing thumbnail preview (desktop only — `(hover: none)` hides it on touch).
- **Sections**: fade/slide in on scroll via `IntersectionObserver`.

## Run locally

Any static server works, e.g.:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "Initial portfolio"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Then in the repo settings → Pages, set source to the `main` branch, root folder.
