# Local-only personal records

User decision: no login. Personal records remain personal; the proposed new public wall belongs on Home and may contain only entries explicitly published for that occasion. This release implements local-only storage. The public backend is not available and is not simulated.

Every Buddha, blessing, wealth and ancestor form begins with no storage choice. The enabled option says “仅保存在本机，不上传”. The unavailable option says “发布到主页心愿墙，让大家看见（暂未开放）” and is disabled. Future publication must show a preview and “确认后，这条内容将公开给所有访客查看。” before any upload. No choice is persisted between ceremonies.

All four record writers use `localRecords.js`; the old network adapter rejects wishes/ancestor-wishes paths as defense in depth. Home and the personal wealth record section read only the current browser's `fopusha.private-records.v1` array. No name-based identity, server history queries, automatic import, historical publication or deletion is performed. Record IDs are local display identifiers, not authentication credentials. Stored fields are allowlisted and exclude email/reminder settings. Server records and backend settings remain unchanged.

The UI explains that records do not sync across devices, clearing browser data may lose them, and people sharing the browser may see them. Success requires localStorage.setItem to complete; quota, blocked storage and malformed stored data do not produce success or overwrite malformed existing data. A failed save retains inputs for retry. Optional wealth-card rendering/statistics cannot turn an already saved record into a false save failure.

The separate existing VisionMaker service uploads only after its own explicit generation action. Its UI now explains which profession/theme fields are uploaded and that local prayer records are neither uploaded nor published by it. Local record saving never invokes it. Email/reminder controls on the ancestor record form are disabled for this local-only release.

Validation: `node scripts/test-local-records.mjs` checks explicit choice, allowlisted fields, persistence, quota/blocked/corrupt storage preservation, abort, the four local adapters, and network denial. `test-local-records-browser.mjs` covers all four flows at 390x844, 844x390, 667x320 and 1366x768: fresh choices, unavailable public action, quota failure, input preservation, retry, duplicate prevention, reload/personal record display and isolation of a fresh browser context. All mutating network requests and record reads are intercepted and fail the test if attempted. Existing integration/runtime/sound, memorial, blessing-draft, wealth, sanctuary, SEO and image checks are also run.

Browser test prerequisites: installed Playwright (or PLAYWRIGHT_MODULE pointing to its module), optional CHROMIUM_EXECUTABLE, TEST_BASE (defaults to http://127.0.0.1:5174), optional TEST_EVIDENCE output directory. Do not run against real records or migrate them for testing.

Rollback baseline: 469ffd726b8f6fe51774a37940beb03d00d7d01f. Restoring that version would restore the old network-saving behavior, so any rollback must explicitly consider this privacy regression. Deploy through the existing master -> Cloudflare Pages Git integration only. No Worker/API settings or credentials are changed.

Remaining work: the homepage public wall, preview/confirmation, publication and owner-authorized withdrawal are NOT implemented. Worker management access previously returned No access and was not retried through alternate paths. A lawful existing backend access path and an approved per-record management capability/storage design are prerequisites for that separate work.
