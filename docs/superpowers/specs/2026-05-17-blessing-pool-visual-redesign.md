# Fopusha Blessing Pool Visual Redesign

## Goal

The blessing pool on `fopusha.com` should feel as visually distinct as the Buddha selection cards above it. Each blessing option should have its own recognizable object, color mood, and symbolic scene instead of sharing the same small prayer-board image with different text.

## Visual Direction

Use a realistic devotional object style that matches the existing Buddha cards: warm lighting, clean cutout or soft circular composition, gentle gold/cream background, and clear symbolic objects.

The cards should remain calm and respectful, not cartoonish, not overly commercial, and not visually louder than the Buddha section.

## Theme Mapping

- `求财`: treasure bowl, gold ingots, coins, warm gold.
- `求健康`: medicine gourd, herbs, soft green.
- `求平安`: peace talisman, lotus lamp, protective knot, cream gold.
- `求学业`: scroll, brush, Wenchang tower, blue-gold.
- `求长寿`: peaches, crane, pine, red-gold.
- `求姻缘`: red thread, paired lotus, soft pink-gold.
- `求子嗣`: pomegranate, lotus seed pod, warm family blessing mood.
- `求消灾`: protective talisman, purification flame/light, deep blue-gold.
- `求功名`: honor roll, seal, ceremonial tablet, cinnabar-gold.
- `求福禄`: gourd, deer, blessing pouch, orange-gold.
- `求和平`: dove, lotus, clouds, sky blue.
- `求家亲`: reunion lantern, home silhouette, osmanthus, warm cream.

## UI Behavior

The homepage grid keeps the existing 12-card layout and click behavior. Only the visual assets and card treatment change.

Each card should show:

- A larger circular or medallion-style image, closer in presence to the Buddha card portraits.
- The blessing label below the image.
- Optional one-line subtitle only if it improves clarity without clutter.

The modal can continue using the existing large background image for now. After the small-card redesign is approved visually, the modal background images can be upgraded in a second pass.

## Asset Plan

Replace the 12 files currently referenced by `frontend/src/data/blessings.js`:

- `frontend/public/thumbs/blessing-caishen.webp`
- `frontend/public/thumbs/blessing-jikang.webp`
- `frontend/public/thumbs/blessing-pingan.webp`
- `frontend/public/thumbs/blessing-xueye.webp`
- `frontend/public/thumbs/blessing-shou.webp`
- `frontend/public/thumbs/blessing-yinyuan.webp`
- `frontend/public/thumbs/blessing-siling.webp`
- `frontend/public/thumbs/blessing-xiaozai.webp`
- `frontend/public/thumbs/blessing-gongming.webp`
- `frontend/public/thumbs/blessing-fulu.webp`
- `frontend/public/thumbs/blessing-heping.webp`
- `frontend/public/thumbs/blessing-jiaqin.webp`

Keep the same file names to avoid data-file churn and route/cache mistakes. Generate or prepare images at higher resolution, then export compressed WebP assets for the site.

## Implementation Scope

First pass:

- Replace the 12 thumbnail assets.
- Adjust `BlessingPool.vue` card CSS so the images are larger and more comparable to the Buddha card visual weight.
- Keep existing data structure, submission flow, modal behavior, and backend untouched.

Second pass, only if needed:

- Replace modal background images in `frontend/public/qf`.
- Add per-theme subtitle text.
- Add hover color accents per blessing category.

## Validation

- Run `npm run build`.
- Confirm the 12 blessing cards are visually distinct on desktop and mobile.
- Confirm click-to-open modal and submit behavior still works.
- Confirm asset size remains reasonable for PageSpeed.

