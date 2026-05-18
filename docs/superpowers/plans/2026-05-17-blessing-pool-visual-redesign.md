# Blessing Pool Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the repetitive blessing pool thumbnails with 12 visually distinct realistic devotional-object images and adjust the card layout so the blessing pool feels closer in visual quality to the Buddha cards.

**Architecture:** Keep the current `BLESSINGS` data contract and click/submit flow unchanged. Replace only the existing thumbnail files under `frontend/public/thumbs` and adjust `BlessingPool.vue` card CSS to give the images more presence.

**Tech Stack:** Vue 3, Vite, static public assets, WebP thumbnails, PowerShell, Node/npm build.

---

## File Structure

- Modify: `frontend/public/thumbs/blessing-caishen.webp` through `frontend/public/thumbs/blessing-jiaqin.webp`.
- Modify: `frontend/src/components/BlessingPool.vue`.
- Verify only: `frontend/src/data/blessings.js`.
- Do not modify backend files or submission endpoints.
- Do not modify modal background files in `frontend/public/qf` in this first pass.

---

### Task 1: Prepare Distinct Thumbnail Assets

**Files:**
- Modify: `frontend/public/thumbs/blessing-caishen.webp`
- Modify: `frontend/public/thumbs/blessing-jikang.webp`
- Modify: `frontend/public/thumbs/blessing-pingan.webp`
- Modify: `frontend/public/thumbs/blessing-xueye.webp`
- Modify: `frontend/public/thumbs/blessing-shou.webp`
- Modify: `frontend/public/thumbs/blessing-yinyuan.webp`
- Modify: `frontend/public/thumbs/blessing-siling.webp`
- Modify: `frontend/public/thumbs/blessing-xiaozai.webp`
- Modify: `frontend/public/thumbs/blessing-gongming.webp`
- Modify: `frontend/public/thumbs/blessing-fulu.webp`
- Modify: `frontend/public/thumbs/blessing-heping.webp`
- Modify: `frontend/public/thumbs/blessing-jiaqin.webp`

- [ ] **Step 1: Create source prompts or object descriptions**

Use these final visual mappings:

```text
blessing-caishen.webp: realistic treasure bowl with gold ingots and coins, warm gold devotional light
blessing-jikang.webp: realistic medicine gourd with herbs, soft green devotional light
blessing-pingan.webp: realistic peace talisman with lotus lamp and protective knot, cream gold light
blessing-xueye.webp: realistic scroll, brush, and Wenchang tower, blue-gold scholar mood
blessing-shou.webp: realistic longevity peaches with crane and pine hints, red-gold light
blessing-yinyuan.webp: realistic red thread and paired lotus flowers, soft pink-gold light
blessing-siling.webp: realistic pomegranate and lotus seed pod, warm family blessing mood
blessing-xiaozai.webp: realistic protective talisman with purification flame/light, deep blue-gold
blessing-gongming.webp: realistic honor roll, seal, and ceremonial tablet, cinnabar-gold light
blessing-fulu.webp: realistic gourd, deer motif, and blessing pouch, orange-gold light
blessing-heping.webp: realistic white dove, lotus, and clouds, sky-blue peaceful light
blessing-jiaqin.webp: realistic reunion lantern, home silhouette, and osmanthus, warm cream light
```

- [ ] **Step 2: Export each asset as WebP**

Each output should be square, at least `512x512`, with the subject centered and enough padding for a circular crop.

Save using the exact existing filenames in `frontend/public/thumbs`.

- [ ] **Step 3: Check asset sizes**

Run:

```powershell
Get-ChildItem frontend/public/thumbs/blessing-*.webp | Select-Object Name,Length | Format-Table -AutoSize
```

Expected: all 12 files exist. Prefer each file under `120 KB`; if any file is larger, compress it before committing.

---

### Task 2: Update Blessing Card Visual Weight

**Files:**
- Modify: `frontend/src/components/BlessingPool.vue`

- [ ] **Step 1: Increase card image presence**

In `BlessingPool.vue`, update the `.blessing-item`, `.blessing-icon`, and `.blessing-label` CSS to this shape:

```css
.blessing-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-height: 168px;
  padding: 16px 10px 14px;
  background:
    radial-gradient(circle at 50% 28%, rgba(255, 245, 214, 0.88), rgba(252, 246, 230, 0.82) 56%, rgba(247, 238, 219, 0.78));
  border: 1px solid rgba(180,140,80,.2);
  border-radius: 14px;
  cursor: pointer;
  transition: transform .2s, box-shadow .2s, border-color .2s;
}

.blessing-icon {
  width: 104px;
  height: 104px;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid rgba(212,168,67,0.34);
  background: linear-gradient(135deg, #f8edcf, #efe0bc);
  box-shadow:
    0 0 0 5px rgba(212,168,67,0.1),
    0 10px 26px rgba(95, 58, 18, 0.12);
}

.blessing-label {
  font-size: .9rem;
  color: var(--accent);
  opacity: 0.9;
  font-weight: 600;
}
```

- [ ] **Step 2: Adjust mobile size**

In the existing `@media (max-width: 600px)` block, update the icon size:

```css
@media (max-width: 600px) {
  .blessing-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .blessing-item { min-height: 132px; padding: 12px 6px; }
  .blessing-icon { width: 72px; height: 72px; }
}
```

- [ ] **Step 3: Build**

Run:

```powershell
Set-Location frontend
npm run build
```

Expected: Vite build completes successfully.

- [ ] **Step 4: Restore generated build artifacts if they are tracked**

Run from repo root:

```powershell
Set-Location D:\document\xiaoxinpad8085_termux_html
git restore frontend/dist/index.html frontend/dist/robots.txt frontend/dist/sitemap.xml frontend/public/sitemap.xml
```

Expected: only source files and thumbnail assets remain modified.

---

### Task 3: Verify and Deploy

**Files:**
- Verify: `frontend/src/components/BlessingPool.vue`
- Verify: `frontend/public/thumbs/blessing-*.webp`

- [ ] **Step 1: Inspect git diff**

Run:

```powershell
git diff -- frontend/src/components/BlessingPool.vue
git status --short
```

Expected: changes are limited to `BlessingPool.vue`, 12 thumbnail WebP files, and plan/spec docs if not already committed.

- [ ] **Step 2: Commit implementation**

Run:

```powershell
git add frontend/src/components/BlessingPool.vue frontend/public/thumbs/blessing-*.webp
git commit -m "Improve blessing pool thumbnails"
```

Expected: commit succeeds.

- [ ] **Step 3: Push to GitHub**

Run:

```powershell
git push origin master
```

Expected: Cloudflare Pages receives the new commit and starts deployment.

- [ ] **Step 4: Confirm live deployment**

Run:

```powershell
curl.exe -L -s https://www.fopusha.com/ | Select-String -Pattern "Home-"
```

Then open the homepage and confirm the blessing pool cards look distinct on desktop and mobile.

---

## Self-Review

- Spec coverage: the plan covers 12 distinct thumbnail replacements, card CSS improvement, build validation, and deployment.
- Scope check: modal background replacement remains explicitly out of first-pass scope.
- Placeholder scan: no placeholder markers or incomplete implementation instructions are present.
- Type consistency: existing `BLESSINGS.icon` paths remain unchanged, so no data-model change is required.
