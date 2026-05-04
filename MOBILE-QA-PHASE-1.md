# Mobile QA Report — Phase 1

**Branch:** `conversion-optimization-phase-1`
**Commit audited:** `8104c1f` — feat: anti-tarnish badge on PDP
**Date:** 2026-04-30
**Audit scope:** ONLY changes shipped in Phase 1 so far. Items 2–8 of `PHASE-1-PLAN.md` are not yet implemented and therefore not audited.

---

## ⚠️ Important scope correction

The prompt asks to audit "trust badges" and "sticky CTA overlap." Two things to flag up-front:

1. **`snippets/mobile-toolbar.liquid` does not exist** in this theme. Glob `snippets/*toolbar*` and `snippets/*sticky*` both return zero matches. The mobile sticky CTA lives inline inside `sections/hov-product-conversion.liquid` (markup at lines 141-155, CSS at lines 502-551, mobile-only display at 589-591). Audit performed against that block.
2. **Trust badges row (Phase 1 item #5) is NOT yet built.** The only "new" PDP element in this commit is the single anti-tarnish badge (`.bat-badge`) under the product title. The pre-existing `.hov-trust-badges` row (section lines 70-75) showing `badge_1..4` predates Phase 1 and was not modified. So "do new trust badges overlap the sticky CTA?" is moot — they don't exist yet. The badge that *does* exist sits at the top of the content column, far from the sticky bar.

---

## 1. CSS rules added in Phase 1 — breakpoint coverage

All new CSS lives in **`snippets/badge-anti-tarnish.liquid`** lines 18-49. No CSS was added to `assets/theme.css.liquid` or to the section's `<style>` block.

| # | Selector | Location | Mobile (base) | Desktop (≥990px override) | Verdict |
|---|---|---|---|---|---|
| 1 | `.bat-badge` | snippet:19-34 | font 0.8125rem, padding 0.5em 0.875em | font 0.875rem, padding 0.5em 1em | ✅ Mobile-first base + explicit min-width override |
| 2 | `.bat-badge__icon` | snippet:35-39 | width/height in `em` (scales with text) | (inherits) | ✅ No breakpoint needed — em-based intrinsic responsiveness |
| 3 | `.bat-badge__text` | snippet:40-42 | `overflow-wrap: anywhere` | (inherits) | ✅ No breakpoint needed — wrapping rule is breakpoint-agnostic |
| 4 | `@media (min-width: 990px) .bat-badge` | snippet:43-48 | n/a | desktop overrides | ✅ The breakpoint itself |

**Coverage verdict:** every new rule either has explicit mobile/desktop branches, or is intrinsically responsive via relative units (`em`, `%`). No rule is desktop-only with no mobile fallback.

**Convention note:** the snippet uses **mobile-first** (base = mobile, `min-width` for desktop) while the rest of the theme is **desktop-first** (base = desktop, `max-width: 989px` overrides at section line 552). Both are valid. Visually identical result. Flagging only because future devs reading both files will see two conventions side-by-side.

---

## 2. Sticky CTA vs new badge — overlap check

### How the sticky CTA works on mobile (pre-existing)

- Markup: `sections/hov-product-conversion.liquid` lines 141-155.
- CSS: lines 502-551.
- Visibility rule (line 509): `display: none` by default; flipped to `display: block` at `≤989px` (line 589-591).
- Positioning (line 503-507):
  ```
  position: fixed;
  bottom: 14px;
  left: 14px;
  right: 14px;
  z-index: 30;
  ```
- Always visible while on mobile PDP. No scroll-show/hide logic. Backdrop-blur over a 96%-opaque white card.

### Where the new `.bat-badge` sits

- Markup: `sections/hov-product-conversion.liquid` lines 49-52, immediately after the H1 title.
- DOM position: top of the `.hov-content` column → far above the fold on mobile.
- Positioning: normal document flow (no fixed/absolute/sticky).

### Overlap analysis

| Scenario | Result |
|---|---|
| User lands on PDP, hasn't scrolled | Badge is above the fold; sticky bar sits at bottom of viewport. **No overlap.** |
| User scrolls so the badge approaches viewport bottom | Badge is in normal flow, scrolls up and off. Sticky bar's z-index (30) sits over it during transit. **Visual overlap for ~1 scroll moment** — same as any other content scrolling past the sticky bar. Not a regression. |
| User has scrolled past the badge entirely | Badge is gone from view. Sticky bar shown alone. **No conflict.** |

**Verdict on the prompt's question:** the new badge does **not** overlap the sticky CTA in any persistent way. The sticky CTA's z-index keeps it on top during scroll-past, which is the intended behaviour.

---

## 3. Fixed-width audit (looking for any width that could exceed 100vw)

Searched all CSS introduced in Phase 1.

| Property occurrence | File:line | Value | Risk on small viewports? |
|---|---|---|---|
| `max-width: 100%` | `snippets/badge-anti-tarnish.liquid:23` | 100% (relative) | ✅ Bounds badge to parent — cannot exceed container, never exceeds 100vw |
| `width: 1.125em` | `snippets/badge-anti-tarnish.liquid:36` | 1.125em (≈14.6px @ 13px base, 15.75px @ 14px base) | ✅ Tiny absolute size, scales with text |
| `height: 1.125em` | `snippets/badge-anti-tarnish.liquid:37` | (same) | ✅ Same |
| `padding: 0.5em 0.875em` / `0.5em 1em` | `snippets/badge-anti-tarnish.liquid:25, 46` | em-based | ✅ Relative |
| `gap: 0.5em` | `snippets/badge-anti-tarnish.liquid:22` | em-based | ✅ Relative |
| `border-radius: 999px` | `snippets/badge-anti-tarnish.liquid:26` | clamp value, never affects width | ✅ Cosmetic |

**No fixed pixel widths. No values that could exceed 100vw.** The only absolute-pixel `width:` declarations are the 1.125em-converted ~15px icon sizes.

---

## 4. Risks (flagged, not auto-fixed)

### 🟡 Medium — Inline `<style>` tag inside a renderable snippet

Location: `snippets/badge-anti-tarnish.liquid:18-49`.

The snippet emits its `<style>` block inline alongside the markup. If the badge is ever rendered more than once per page (e.g., once in the PDP and once in a future cart drawer), the same `<style>` tag will duplicate. Browsers de-dupe identical adjacent style declarations, so it's not a *correctness* issue, but it's wasteful and HTML-validator-noisy.

**Not fixing.** Single render today, plan to address only if/when the snippet is reused.

### 🟡 Medium — Background color contrast on the badge

Badge uses `background: rgba(15, 59, 46, 0.08)` (≈ `#0F3B2E` at 8% opacity) over the section background `#FCFAF7` (declared at section line 167 via `--hov-bg`). Effective rendered color ≈ `#EBE8E5`. The text is `#0F3B2E` on that. WCAG-AA wise it should pass for body text on close inspection but I haven't actually measured contrast on a real device.

**Not fixing.** Recommend a quick visual check on the staging URL with a real Android low-brightness setting before approving.

### 🟡 Medium — Pre-existing sticky bar has no body padding compensation

Section line 502+: the sticky bar is `position: fixed; bottom: 14px` and **does not** add bottom padding to the page body. On mobile this means the last ~70px of the page (footer text, "recently viewed" cards, etc.) sits behind the sticky bar.

**This is pre-existing — not introduced by Phase 1.** Already noted in `PHASE-1-PLAN.md` §6 as part of Phase 1 item #6 (sticky bar improvement). The badge change does not worsen it because the badge is at the top of the content, not the bottom.

### 🟡 Low — Convention mismatch in CSS direction

The new snippet uses mobile-first (`min-width` overrides), the rest of the theme uses desktop-first (`max-width` overrides). Both work; only relevant for future maintainers.

**Not fixing.** Two valid conventions — picking one would require touching unrelated code.

### 🟢 Info — Schema setting references a metafield that may not exist

`sections/hov-product-conversion.liquid` schema entry for `guarantee_badge_text` shows the help text "Per-product override: set product.metafields.custom.guarantee_text". If the merchant hasn't defined that metafield in Shopify Admin → Settings → Custom Data, the per-product override won't work but the section-default still renders correctly. Not a mobile issue but worth a heads-up before staging review.

**Not fixing.** Documented in PHASE-1-PLAN.md §"Action items" #5.

---

## 5. Things that are NOT risks (verified)

- ✅ Badge does not break the existing layout — without the snippet rendering, DOM is byte-identical to pre-Phase-1.
- ✅ Badge has `max-width: 100%` so it cannot push the column wider on narrow viewports.
- ✅ Badge sits in normal flow — no `position: fixed/absolute/sticky`, cannot overlap any fixed element.
- ✅ Badge SVG icon is `aria-hidden="true"` and `focusable="false"` — keyboard-tab order unaffected.
- ✅ The `if section.settings.show_guarantee_badge` gate means the merchant can disable the entire feature with one click; rollback to no-badge state is one toggle, not a code change.
- ✅ Schema JSON re-validated as parseable (verified during commit).
- ✅ `shopify theme check` returned 0 new offenses in the two changed files.

---

## 6. Recommended manual checks before merging to `vinay`

1. View on iPhone SE viewport (375×667) — confirm badge fits on one line under the title.
2. View on Android Galaxy S8 (360×740) — same.
3. View on iPhone 14 Pro Max (430×932) — confirm desktop-style spacing kicks in only above 990px (it shouldn't on mobile).
4. With long custom badge text in the theme editor (e.g. "12-Month Anti-Tarnish & No-Fade Guarantee on All Pieces") — verify wrapping looks acceptable.
5. With `show_guarantee_badge` toggled OFF — confirm DOM has no `.bat-badge` element and no orphan whitespace gap.
6. Toggle URL `?preview_theme_id=…` to confirm theme settings panel surfaces the new "Anti-tarnish guarantee badge" header.

---

## 7. Open from PHASE-1-PLAN.md (still unanswered, not blocking this audit)

These were flagged at plan-write time and are still relevant for items 2–8:

1. Add the missing price block as a precondition before further changes?
2. Confirm the 4-pill / 3-bullet split for Change 4 (Waterproof duplication)?
3. Backup the live `hov-product-conversion.liquid` into `backup-original/` before further edits?
4. Multi-locale copy in Phase 1 or Phase 2?
5. New metafield definitions in Shopify admin — your task or mine?

---

*End of report — no code modified.*
