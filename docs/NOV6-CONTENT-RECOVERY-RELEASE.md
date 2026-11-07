# November 6 content and recovery release

Baseline: ca738d1ba3c52feec5c3da3160a6038e9ae21ee9 on davard123/baifo master. Integrated and checked November 7, 2026 UTC.

## Changes
- Eager Nianfo route recovery controller and accessible shell, shared by Simplified and Traditional routes. Complete lazy loader wrapping, earliest guards, history intent tracking, sanitized diagnostics and teardown. Retry is explicit and uses the recorded allowlisted route without query/hash. Dismissal retains a home action and restores focus only when still appropriate.
- Existing ancestors guide gains six original memorial-writing examples, five visible questions, and a tested memorial-writing anchor. Related topic links point to this section. The local guide text palette now matches the existing light cards.
- Corrected the guide's outdated submission description using the current localRecords implementation: local-only saves do not upload the text; they send only a record kind for count statistics. Public saves send the public wish-wall fields. No data-flow or save behavior was changed.
- Added sound-help to the current counter, including server-rendered text. Woodfish controls have a stable name with aria-pressed and descriptive text. Background music uses a visible action name with no second toggle semantic. The two existing modal overlays have inline access to the same shared background-music state.
- No additional FAQPage schema, new landing page, tracking, customer submission, account, or deployment mechanism.

## Verification
Production build succeeded. Existing required CI checks passed locally: blessing drafts, local records, wealth ritual, sanctuary, SEO output (80 pages per language), image mappings. Additional V10 runtime, dedication sound and memorial inscription suites passed.
45 recovery/accessibility/integration tests passed, including actual Vue Router initial rejection in both locales, cancelled stale import, diagnostic redaction, unavailable storage, audio failure, counts, and shared music state. These tests are now part of the existing validation workflow.

The archived candidate test that read a non-runtime integration example now tests actual main/router/App integration. Its executable private-error diagnostic test is preserved in integration.test.mjs. The panel source assertions allow the added active CSS class while retaining locale boundaries, persistent live regions, native buttons, no autofocus, scoped styles, and no storage/network access.

Local browser checks used a dedicated 127.0.0.1 origin and a server that disallows production API connections. Verified:
- Initial JS rejection, later route rejection with previous content intact, no focus stealing, keyboard dismissal and correct return focus.
- Traditional recovery, CSS preload failure, repeated explicit retry, and successful recovery after removing injected failure.
- Sound enable does not count, Enter and Space each count once, woodfish and music remain independent, and persisted off/count values survive reload.
- Shared music controls work by keyboard inside the Nianfo and blessing overlays. Six examples, five questions and Simplified/Traditional text/metadata render.
- 320px DOM layout checks show no horizontal overflow for recovery, counter, memorial guide, and blessing modal. Desktop screenshots inspected; mobile screenshot capture timed out.

## Existing limits, not represented as passing
- test-integration.mjs fails because its old ritual mock lacks state.done. The same error was reproduced on the unchanged baseline.
- check-static-navigation.mjs expects 71 pages but current baseline source defines 80. The release build has 160/160 language pages and no missing internal graph nodes; old hardcoded count assertions fail. Baseline also fails and has stale prebuilt sitemap output. The unrelated script was not weakened.
- Existing Nianfo and blessing dialogs handle Escape but do not fully contain Tab focus. This release does not claim whole-site modal accessibility.
- Real screen-reader output, subjective audio listening/loudness, physical mobile devices, and browser back/forward race timing were not fully verified. Controller/history race tests passed.
- Direct HTTP access to fopusha.com root returned 403; the previously restricted guide paths were not retried. This is an access limitation, not evidence of website failure.

## Publication and rollback
Use the existing master push -> Cloudflare Git build, with GitHub validation. No direct competing upload. Verify the exact remote commit and its Cloudflare and validation checks before calling deployment successful. Custom-domain bytes require an authorized accessible route; a Cloudflare success check alone does not prove those bytes were fetched.

Rollback by reviewing and reverting this feature commit through the same Git deployment route. No force push or data deletion.
