# Blessing completion release

Baseline / rollback: `9efc33bc60774ff487fc0e73ccfe381b6209c59a`.
Its successful Cloudflare Pages deployment was `c65f6dcf-6801-4ae9-9100-2d90d6dd6c7f`.
Production uses the existing master -> Cloudflare Git integration. Revert this release commit through that same path to roll back; do not force-push or upload a competing build.

BlessingPool now keeps a clearly labelled completion/dedication action visible below the scrolling controls and form, including short landscape viewports. The full blessing text is retained after the form, so users need not scroll past it to complete. Bowing closes the drawer to show the stage. Only a successful HTTP response with `status: success` completes the session, closes the drawer and offers reopening the result. Failures retain the form. Duplicate submissions are blocked. Closing, changing the active blessing, or unmounting aborts and invalidates an outstanding request; late results cannot complete the next blessing. Cancelling the UI is not a guarantee of server rollback after a request has reached the server.

Warmup uses the health endpoint only, in both the client and the scheduled workflow. **This does not fix record access control.**

Validation: production build; 71 generated-page SEO checks; image assets and mappings; existing integration, dedication runtime and sound tests; blessing drafts, wealth ritual and sanctuary checks. Browser regression uses only synthetic A/B records and intercepts every API request; all non-local requests are blocked. Chromium passed at 390x844, 844x390, 667x320 (reduced motion), and 1366x768: visible completion, business/HTTP/network/invalid-JSON failures, retry, duplicate submit, cancellation with late A response after B opens, success closure, result reopening, and bow closure. Screenshots and JSON results are retained in the task evidence directory.

Re-run browser tests with a local dev server on 127.0.0.1:5173 and `node scripts/test-blessing-browser.mjs`. Playwright must be available; alternatively set `PLAYWRIGHT_MODULE` to its installed module URL and `CHROMIUM_EXECUTABLE` to the browser binary. No production API is used.

## Separate wish-wall dependency

Source inspection and offline extracted-handler tests with synthetic A/B rows confirm that `backend/main.py` GET handlers accept arbitrary username filters without authenticated identity or ownership. Home's local name is not authentication. QiucaiPage already has a legacy wall loaded from the unfiltered wishes endpoint and filters `blessing === 'caishen'`; this is not explicit per-record publish consent.

Do not ship a claim of private server storage on this foundation. A subsequent release needs an approved identity/ownership design and backend authorization migration, including treatment of ownerless legacy data without assigning ownership by name. Existing records must not be migrated to public content. New records must default to private, publication must use an explicit preview and fresh per-record confirmation, public serialization must exclude email/age/target and other private fields, and owner-only withdrawal must remove the public representation. Test ownership, direct-ID access, publication and withdrawal with synthetic A/B principals before deployment. No identity provider, credentials, account permissions or backend security settings were created or changed in this release.
