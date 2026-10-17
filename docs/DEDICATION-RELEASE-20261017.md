# Dedication V10 and quiet sound release

Scope: eight Buddha dedication success animations and one optional synthesized low bowl-like hit. No API, prayer data, promotion, privacy, loan, Cloudflare settings or deployment workflow changes.

Rollback baseline: `ead0c55a2775e2c252c46d8a3d5ab705321524dc` on `davard123/baifo:master`. Its successful Cloudflare Pages deployment is `cb2b210b-2c3c-4eba-917b-efad61ceb0ca` in project `baifo`, with immutable URL https://cb2b210b.baifo-78s.pages.dev . The fopusha.com frontend script filename matches that deployment; content hashes are recorded in local release evidence.

Production path: push this narrowly scoped commit to existing master; existing Cloudflare Git integration builds the frontend. GitHub Actions validates the build, SEO output and image mappings. Do not upload a competing direct build. Do not force-push or delete the old version. To undo this feature, review and revert the feature commit, then use the same existing Git deployment path.

Source: `frontend/src/components/PrayerStage.vue`, `frontend/src/pages/BuddhaPage.vue`, `frontend/src/utils/dedicationSound.js`, and `frontend/vendor/dedication-v10/`. Rebuild the checked-in browser runtime with `node vendor/dedication-v10/build-browser.cjs` from frontend. Original eight portraits remain in `frontend/public/a1-20260906.webp` through a8; the two additional hand/arm composition assets are in `frontend/public/dedication-v10/`.

Artwork provenance: V10 Library package `libfile_9a2a3b172e60819196429cdd40286d28`, 6088175 bytes, SHA256 `316ebcbf88437099735af1fc6189c96f44b19e556001088352343e730f8ba4a4`. All eight original portraits match the package byte-for-byte. Canvas effects use those originals; there is no replacement face generation. Complete original archive is retained in the local delivery workspace.

Behavior: success closes the drawer, then plays once for 3 seconds. Light precedes enlargement and the brief shake. Canvas follows the existing image's actual rectangle. Failed submissions do not play. Cancellation/navigation/unmount restores the original image and clears work. Reduced motion skips animation and sound. Sound is Web Audio synthesis, no downloaded audio/copyright asset; initially silent, unlocked only by a user gesture, triggered once by an actually rendered 1.28–1.65s peak frame. Default sound preference is on, but page load never plays. The accessible toggle stores only a boolean in localStorage (`fopusha.dedication.muted.v1`). Failure to access storage or audio never fails a dedication.

Validation from frontend: `node test-integration.mjs`, `node test-v10-runtime.mjs`, `node test-dedication-sound.mjs`, `npm run build`, `node scripts/check-seo-output.mjs`, `npm run check:images`. Tests inject API mocks; do not submit real prayers for production validation. Runtime tests use a no-op Canvas context, not a screenshot. Supported browser automation was unavailable, so actual visual continuity, sound loudness and mobile frame rate remain manual acceptance items.

The standalone preview and its mock API are separate from this repository; they must never be copied into production. Verify the release marker and static asset hashes on fopusha.com and the exact successful deployment URL after the Git deployment finishes.
