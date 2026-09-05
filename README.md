# Portfolio site — Abdallah Shabaan

A single-page portfolio. No build step, no framework, no dependencies to install.

```
index.html                     the whole site
media/                         10 clips + poster images (23 MB total)
Abdallah_Shabaan_Resume.pdf    linked from "Download CV"
```

## Put it online

**Netlify Drop** — easiest. Go to https://app.netlify.com/drop and drag this
whole folder onto the page. You get a live URL in about ten seconds. Free.
Add your own domain later in Site settings → Domain management.

**GitHub Pages** — good if you want the URL tied to your GitHub account.
Create a repo, upload these files to the root, then Settings → Pages → Deploy
from branch → `main` / `root`. Your site appears at
`https://abdallam1997.github.io/<repo-name>/`.

**Cloudflare Pages** or **Vercel** work the same way. Any static host will do.

## Buy a domain

`abdallahshabaan.com` or `.dev` costs roughly $10–15/year from Namecheap,
Porkbun or Cloudflare. A custom domain on your CV and proposals looks
materially more professional than a `.netlify.app` subdomain. Worth the money.

## Editing

Everything is in `index.html` — HTML at the top, CSS in the `<style>` block,
one small script at the bottom. Open it in any text editor (VS Code is free).

**To change a project's text:** find its `<article class="project">` block and
edit the `<h3>`, `<p class="desc">`, and the `<ul class="stack">` items.

**To add a project:** copy a whole `<article class="project">` block, paste it,
and swap the text and the video filenames. Add `class="project flip"` to put
the video on the right instead of the left. Alternate them so the page has
rhythm.

**To swap a video:** drop your new file in `media/` and change the `src` and
`poster` paths. Keep clips short (30–60 seconds), silent, and under about
5 MB each — big files make the page slow, which costs you visitors.

To make a poster image from a video, if you have ffmpeg installed:

```
ffmpeg -ss 12 -i media/yourclip.mp4 -frames:v 1 -q:v 4 media/yourclip.jpg
```

**Colours and fonts** are the `:root` variables at the top of the `<style>`
block. Change `--teal` and `--clay` and the whole page follows.

## How the videos behave

Clips autoplay silently when they scroll into view and pause when they scroll
away, so the page doesn't download all 23 MB at once. Anyone with "reduce
motion" turned on gets normal play buttons instead. This is deliberate — leave
`muted`, `loop` and `playsinline` on any video you add, or mobile browsers will
refuse to autoplay it.

## Before you share the link

- Confirm the project titles and descriptions are accurate.
- Replace `media/ar-tiger.mp4` in the hero with your strongest clip if you'd
  rather lead with something else.
- Check it on your own phone, not just a desktop browser.
