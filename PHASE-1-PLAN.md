# Phase 1 Implementation Plan — Product Page

**Branch:** `conversion-optimization-phase-1`
**Scope:** Live PDP only (`sections/hov-product-conversion.liquid`)
**Status:** DRAFT — awaiting approval, no code yet

---

## 0. Pre-conditions and shared assumptions

### 0.1 Target file
All eight changes land in **`sections/hov-product-conversion.liquid`** (the section actually wired into `templates/product.json` → `"product": { "type": "hov-product-conversion" }`). The file is 848 lines, fully self-contained: HTML at lines 1–152, `<style>` at 153–588, `{% render 'hov-product-makeover' %}` at 590, `<script>` at 604–746, `{% schema %}` at 748–848.

`sections/product-template.liquid` is **not** edited in Phase 1; it's an orphan in the current template.

### 0.2 Conventions for every change below
- **Settings convention:** add new schema settings rather than hard-coding strings — keeps the merchant in control and avoids per-product code edits. Booleans default `true` so the feature is visible immediately on deploy.
- **Per-product overrides:** where the value needs to vary by product (e.g., delivery timeline, low-stock count), read a metafield first, fall back to section setting. Metafields stay under `product.metafields.custom.*` (consistent with the existing `custom.product_tags`, `custom.subtitle`, `custom.guarantee_text` pattern in `templates/product.json` line 38).
- **CSS:** all new styles go inside the existing `<style>` block (153–588) under the same scoping pattern `#hov-product-conversion-{{ section.id }} .hov-…` and reuse the existing CSS variables (`--hov-emerald`, `--hov-gold`, `--hov-ivory`, `--hov-charcoal`, `--hov-muted`, `--hov-border`, `--hov-bg`).
- **Icons:** prefer **inline SVG** (no extra HTTP request, no font-loading flash, easy to recolor with `currentColor`). The Adorn icon font *is* available globally but mixing it inside this self-scoped section creates style coupling we don't want.
- **No new JS files.** All script lives inside the existing `(function () { ... })()` IIFE at lines 604–746 to keep the section single-file.
- **Mobile breakpoint:** `@media screen and (max-width: 989px)` (already in use at line 547). Nothing else.
- **Rollback baseline:** every change is a small, contiguous diff against `backup-original/sections/product-template.liquid` and the `git diff` against the branch start. Every change below lists its own per-change rollback. Global rollback at the end.

### 0.3 Critical preliminary — missing price markup
The section CSS already defines `.hov-price-wrap`, `.hov-price-block`, `.hov-price-current`, `.hov-price-compare`, `.hov-discount-badge`, `.hov-tax-text` (lines 332–383) but **no markup uses these classes**. Price only appears (a) inside the variant `<select>` option label (line 86) and (b) in the sticky bar (line 139).

Change #1 (anti-tarnish badge **above** price) requires a price element to anchor against. **Recommend** adding a real price block at the top of `.hov-content` (after `<h1 class="hov-title">` line 47) as a **precondition for Change #1**. This is technically a 9th change — flagging it explicitly so you can approve or reject before I proceed.

If you'd rather defer the price block, Change #1 can be reframed as "badge above the title" — but that visually diverges from the brief.

### 0.4 Removing the static `★★★★★` review row
Lines 49–54 currently render a hardcoded 5-star span when `show_reviews` is true. This is **fake-review territory** legally and not a Phase-1 item, so I won't touch it — but flagging because Change #4 (benefit bullets) wants the same vertical real estate. The plan slots benefits *below* the review row to avoid conflict.

---

## Change 1 — Anti-tarnish / No-fade badge above price

**Goal:** Render a small pill badge ("✨ 6-Month Anti-Tarnish Guarantee") immediately above the price.

| Field | Value |
|---|---|
| **File** | `sections/hov-product-conversion.liquid` |
| **Line range — markup** | Insert new block between line 47 (`</h1>`) and line 49 (`{% if section.settings.show_reviews %}`). After Change #0.3 the order becomes: title → **anti-tarnish badge** → **price block** → reviews. |
| **Line range — CSS** | Append to the `<style>` block before the closing `</style>` at line 588. The existing `.hov-badge` rule at lines 291–303 already styles a similar pill — extend it with a `.hov-badge--guarantee` variant rather than duplicate. |
| **Line range — schema** | Add `show_guarantee_badge` (checkbox, default `true`) and `guarantee_badge_text` (text, default `"✨ 6 Months Anti-Tarnish Guarantee"`) inside the schema `settings` array (lines 751–841), right after the existing `show_badge`/`badge_text` pair. |
| **Approach** | **Inline markup.** Read `product.metafields.custom.guarantee_text` first (already used elsewhere in the codebase — see `templates/product.json` line 38), fall back to `section.settings.guarantee_badge_text`. No snippet — too small to extract. |
| **Mobile behavior** | Already-responsive `.hov-badge` styling. Reduce `font-size` from 13px → 12px under the existing `@media (max-width:989px)` block (line 547+) and reduce horizontal padding 14px → 12px. Pill must not wrap; let it shrink. |
| **Rollback** | Delete the new markup block, the CSS variant, and the two schema settings. Single commit, revertable via `git revert <sha>`. |

---

## Change 2 — "COD Available" label near buy button

**Goal:** Show "💵 Cash on Delivery available" next to (or directly below) the Add-to-Cart / Buy-It-Now buttons.

| Field | Value |
|---|---|
| **File** | `sections/hov-product-conversion.liquid` |
| **Line range — markup** | Insert directly after `</div>` at line 116 (which closes `.hov-buttons`), **before** `{% endform %}` at line 117. New element: `<div class="hov-cod-line">…</div>`. |
| **Line range — CSS** | New `.hov-cod-line` rule appended in the `<style>` block before line 588. Style: small flex row, 13px text, `--hov-emerald` icon, 12px top margin, no border. |
| **Line range — schema** | Add `show_cod` (checkbox, default `true`) and `cod_text` (text, default `"Cash on Delivery available"`) right after the new guarantee settings from Change 1. |
| **Approach** | **Inline markup**, gated by `section.settings.show_cod`. Per-product opt-out via `product.metafields.custom.cod_disabled` (boolean). Hide entirely when `cod_disabled` is true so high-value SKUs that don't qualify for COD don't lie. |
| **Mobile behavior** | The buttons already collapse from two columns to one column on mobile (line 581–583). The COD line sits below the stacked buttons; same 13px font on mobile. |
| **Rollback** | Delete the new markup, CSS, and two schema settings. |

---

## Change 3 — Delivery timeline (4–6 days) text

**Goal:** Show "🚚 Delivery in 4–6 days" near the price/CTA area.

| Field | Value |
|---|---|
| **File** | `sections/hov-product-conversion.liquid` |
| **Line range — markup** | Insert as a sibling of the COD line from Change 2, immediately after the COD `<div>`, still **before** `{% endform %}` at line 117. New element: `<div class="hov-delivery-line">…</div>`. |
| **Line range — CSS** | New `.hov-delivery-line` rule appended in the `<style>` block. Same visual weight as `.hov-cod-line` for consistency — consider extracting both into a shared `.hov-meta-line` base class with modifiers. |
| **Line range — schema** | Add `show_delivery` (checkbox, default `true`), `delivery_days_min` (number, default `4`), `delivery_days_max` (number, default `6`), `delivery_template` (text, default `"🚚 Delivery in {min}–{max} days"`). The template uses `{min}`/`{max}` placeholders so localization can rearrange word order. |
| **Approach** | **Inline markup.** Read `product.metafields.custom.delivery_min` / `delivery_max` first (per-product override for pre-order or oversized SKUs), fall back to section settings. Substitute `{min}`/`{max}` via `replace` filter — no JS. |
| **Mobile behavior** | Identical to COD line. On mobile, sits below COD line in a stacked column. |
| **Rollback** | Delete the new markup, CSS rule, and four schema settings. |

---

## Change 4 — 3 key benefit bullets (Daily wear / Waterproof / Skin-friendly) with icons

**Goal:** A 3-up icon + label row directly under the trust-badges row (which already renders at lines 62–67), used for tactile product benefits, **distinct** from the existing `badge_1..4` pills (which are short positioning words like "Anti Tarnish", "Waterproof", "Hypoallergenic", "Adjustable Fit").

> **Naming clash to resolve:** the existing trust-badges row already says "Waterproof". If we keep both, we'll repeat the word. Recommend: re-purpose the existing 4-pill row for emotional positioning ("Anti Tarnish", "Hypoallergenic", "Adjustable Fit", "Bestseller") and put functional benefits ("Daily Wear", "Waterproof", "Skin-Friendly") in the new 3-bullet row. Confirm before I implement.

| Field | Value |
|---|---|
| **File** | `sections/hov-product-conversion.liquid` |
| **Line range — markup** | Insert as a new section between the existing `.hov-trust-badges` close `</div>` at line 67 and the `{% form … %}` open at line 69. New element: `<ul class="hov-benefits">` with three `<li>` children. |
| **Line range — CSS** | New rules `.hov-benefits` (flex row, 3 columns, 16px gap, no list bullets), `.hov-benefits li` (icon 32px + 13px label stacked vertically), responsive override in the existing `@media` block. Append before line 588. |
| **Line range — schema** | Six settings as a grouped header: `benefits_header` (header), `benefit_1_label` / `benefit_1_icon`, `benefit_2_…`, `benefit_3_…`. The `_icon` field is a `select` with values `daily-wear`, `waterproof`, `skin-friendly`, `gold-plated`, `nickel-free`, `lightweight` mapped to inline SVGs in a new snippet. Defaults: "Daily Wear" / `daily-wear`, "Waterproof" / `waterproof`, "Skin-Friendly" / `skin-friendly`. |
| **Approach** | **New snippet** `snippets/hov-benefit-icon.liquid` containing a `case`/`when` over the icon name and inline SVG output. Snippet is justified here because (a) icon SVG paths are 100+ chars each and would balloon the section, and (b) the same icons may be reused later in cart/footer. |
| **Mobile behavior** | 3 columns on desktop. On mobile, **stay 3 columns** (icons are small) but reduce gap 16px → 10px and icon size 32px → 28px. Labels can wrap to 2 lines if a translation makes them long. |
| **Rollback** | Delete the new markup, CSS, schema settings, **and** delete the new snippet `snippets/hov-benefit-icon.liquid`. List as a 2-file rollback in the commit message so it's easy to follow. |

---

## Change 5 — Trust badges row (Secure checkout / Easy returns / COD) below buy button

**Goal:** A horizontal row of 3 small icon+label cells immediately below the buy buttons — distinct from Changes 2, 3, 4. This is the "post-decision" reassurance row, the last thing the user sees before clicking Add to Cart.

| Field | Value |
|---|---|
| **File** | `sections/hov-product-conversion.liquid` |
| **Line range — markup** | Insert immediately after the new `delivery-line` div from Change 3, still **before** `{% endform %}` at line 117. New element: `<div class="hov-trust-row">` with three `<div class="hov-trust-cell">` children. |
| **Line range — CSS** | New `.hov-trust-row` (3-col grid, 12px gap, top border with 16px padding-top to visually separate from CTA). `.hov-trust-cell` — icon 20px + 12px label inline-flex row. Append before line 588. |
| **Line range — schema** | Group under a header `trust_row_header`. Six settings: `trust_1_label`/`trust_1_icon`, `trust_2_…`, `trust_3_…`. `_icon` select reuses the same `hov-benefit-icon` snippet (so we don't ship two icon systems) but with three additional values: `lock`, `return-arrow`, `cod-cash`. Defaults: "Secure Checkout" / `lock`, "Easy Returns" / `return-arrow`, "Cash on Delivery" / `cod-cash`. |
| **Approach** | **Inline markup**, **shared snippet** for icons (same `snippets/hov-benefit-icon.liquid` from Change 4 — extend its `case` with the three new icons). |
| **Mobile behavior** | 3 columns at all breakpoints. Reduce label font-size from 12px → 11px on mobile to keep on one line. If a label still overflows, ellipsis (`overflow:hidden; text-overflow:ellipsis; white-space:nowrap`). |
| **Rollback** | Delete the new markup, CSS, six schema settings, and the three new icons added to `hov-benefit-icon.liquid`. |

---

## Change 6 — Sticky mobile Buy Now bar improvement

**Goal:** The current sticky bar (lines 136–150, mobile-only via `display:none` desktop / `display:block` mobile at line 584–586) shows price + Add-to-Cart. Improvements: (a) show product thumbnail, (b) show variant title under price, (c) show compare-at strikethrough only when on sale, (d) larger CTA, (e) animate in on scroll past the in-page CTA, (f) prevent body content being hidden under the bar.

| Field | Value |
|---|---|
| **File** | `sections/hov-product-conversion.liquid` |
| **Line range — markup** | Replace the current sticky-bar block at lines 136–150. New structure: `<div class="hov-sticky-bar" hidden>` → `<img class="hov-sticky-thumb">` + `<div class="hov-sticky-meta"><span class="hov-sticky-current"></span> <span class="hov-sticky-compare"></span><span class="hov-sticky-variant"></span></div>` + `<form class="hov-sticky-form">…<button>Add to Cart</button></form>`. |
| **Line range — CSS** | Edit existing rules at lines 498–546 and the mobile override at lines 584–586. Add: 60×60 thumbnail with rounded 12px, taller bar (min-height 72px), bottom-padding shim on `<body>` to prevent content overlap (`scroll-padding-bottom` plus a `body.hov-sticky-active { padding-bottom: 88px; }` toggled by JS). |
| **Line range — schema** | Add `sticky_enabled` (checkbox, default `true`) and `sticky_show_thumb` (checkbox, default `true`). |
| **Line range — JS** | Edit the existing IIFE at lines 604–746. Add an IntersectionObserver on the in-page `.hov-buttons` element — when the in-page CTA leaves viewport, remove the `hidden` attribute on the sticky bar and add `body.hov-sticky-active`; when the CTA re-enters, hide the bar. Variant change handler at lines 615–624 already updates sticky price — extend it to also swap thumbnail and variant title. |
| **Approach** | **Inline markup + JS**, no new files. The IntersectionObserver is the right tool here (no scroll-listener spam). Falls back to "always visible" if `IntersectionObserver` is undefined (we already wrap zoom logic in similar try/catch). |
| **Mobile behavior** | Bar appears only at `≤989px` (already true). Animate in via `transform: translateY(120%)` → `translateY(0)` on a 200ms ease. Tap target ≥ 44×44px (current 46px min-height meets that; bump CTA to 48px to be safe). Respect safe-area: `padding-bottom: max(14px, env(safe-area-inset-bottom))` on the wrapper. |
| **Rollback** | Replace the new sticky-bar markup with the original 14 lines (136–150) from `backup-original/sections/product-template.liquid` is **wrong** — that backup is the old `product-template.liquid`, not the live section. Instead, the per-change rollback is `git checkout HEAD~1 -- sections/hov-product-conversion.liquid` after this commit. **Action item:** add the live section to `backup-original/` *before* this change ships. (See "Action items" at the end.) |

---

## Change 7 — Low-stock urgency text (only if inventory tracked)

**Goal:** "🔥 Only 4 left in stock — order soon" appears when the selected variant has `inventory_management == "shopify"` AND `inventory_quantity ≤ threshold` AND `inventory_quantity > 0`.

| Field | Value |
|---|---|
| **File** | `sections/hov-product-conversion.liquid` |
| **Line range — markup** | Replace lines 56–60 (the existing `show_urgency` block, which currently outputs free-text from a section setting only). Wrap the existing free-text path AND a new auto-low-stock path so they coexist: low-stock takes priority when its conditions are met. |
| **Line range — CSS** | Reuse existing `.hov-urgency` rule (lines 384–393). Add a `.hov-urgency--lowstock` modifier with a warmer background (`rgba(200, 178, 138, 0.15)` using `--hov-gold`) and the existing emerald text color stays. |
| **Line range — schema** | Add `low_stock_enabled` (checkbox, default `true`), `low_stock_threshold` (range 1–20, default `5`), `low_stock_template` (text, default `"🔥 Only {qty} left in stock — order soon"`). Per-variant override via `product.metafields.custom.low_stock_threshold` (number). |
| **Line range — JS** | Edit the existing IIFE. Inside the existing `applyVariant(id)` function (line 615) extend `variantData` (line 593–602) to also include `inventory_management` and `inventory_quantity`, then re-render the urgency element on variant change. Hide the low-stock element when the new variant is out-of-threshold or untracked. |
| **Approach** | **Inline markup + JS-driven update on variant switch.** Server-renders correct state for first variant; JS swaps on variant change. **Critical guards:** (1) only render when `current_variant.inventory_management == "shopify"` (other channels can't be trusted), (2) only when `inventory_quantity > 0` (don't show "Only 0 left" — the sold-out state is handled by the disabled CTA), (3) respect `inventory_policy == "continue"` (oversold-allowed → don't show urgency). |
| **Mobile behavior** | Identical to existing urgency block. Already wraps gracefully on mobile. |
| **Rollback** | Restore lines 56–60 to the original 5-line block. Remove the three new schema settings, the JSON additions in the variantData script, and the urgency-update branch in `applyVariant`. |

---

## Change 8 — Stronger primary CTA button style

**Goal:** Make the "Add to Cart" button visually dominant: larger, more weight, subtle elevation, micro-interaction on hover/active, clear pressed state. The current style (lines 444–460) is flat emerald.

| Field | Value |
|---|---|
| **File** | `sections/hov-product-conversion.liquid` |
| **Line range — CSS** | Edit existing rules at lines 444–460 (`.hov-btn`, `.hov-btn-primary`, `.hov-btn-primary:hover`). No markup changes. Edit the mobile override at line 581–583 (currently only changes grid columns). |
| **Line range — markup** | None — class names stay the same. |
| **Line range — schema** | None — purely visual. |
| **Approach** | **CSS-only.** Changes: <ul><li>min-height 56px → 60px desktop, 56px mobile</li><li>font-weight 700 unchanged; letter-spacing 0 → 0.3px</li><li>add `box-shadow: 0 6px 20px rgba(15, 59, 46, 0.25)` for elevation</li><li>hover: lift 1px (already there) + intensify shadow + slight brightness via `filter: brightness(1.05)` instead of `opacity: 0.92` (opacity dims the white text — bad for contrast)</li><li>active/pressed: shadow shrinks, transform 0</li><li>focus-visible: 3px outline in `--hov-gold` for keyboard accessibility (currently no focus style)</li><li>secondary "Buy It Now" button stays subordinate — slightly reduce its visual weight (border 1px stays, but use `--hov-muted` color until hover) so the primary CTA wins</li></ul> |
| **Mobile behavior** | Buttons already stack to one column on mobile. With 56px height and full-width, the primary button becomes the most tappable element on the page. Confirm the `:active` shadow change doesn't cause jank on iOS Safari (test required). |
| **Rollback** | Revert the edited CSS rules to the original at lines 444–460 and 581–583. Single-file, single-commit rollback. |

---

## Implementation order (recommended)

Execute in this order so each change builds on a deployed-and-verified previous state:

1. **Pre-step:** copy `sections/hov-product-conversion.liquid` into `backup-original/sections/` (currently missing — see action items).
2. **0.3 (precondition):** add real price block markup. Visual smoke test on desktop and mobile.
3. **Change 8** first (CSS-only, lowest blast radius, sets the tone for all subsequent visuals).
4. **Change 1** (anti-tarnish badge — needs the price block from step 2).
5. **Changes 2, 3, 5** in one commit (all three are sibling lines under the CTA, share the new `.hov-meta-line` base style).
6. **Change 4** (benefits row + new snippet).
7. **Change 7** (low-stock urgency — touches existing urgency block carefully).
8. **Change 6** (sticky mobile bar — biggest JS change, do last so other changes are stable when we test).

Each change = one commit. Eight commits + the precondition + the backup = ten commits total.

---

## Global rollback

If the entire branch needs to be abandoned:

```bash
git checkout vinay
git branch -D conversion-optimization-phase-1
```

If individual commits need surgical revert:

```bash
git revert <commit-sha>
```

If a commit reaches production and breaks live PDP:

```bash
# 1. Hot-revert via Shopify theme editor: revert to previous published theme
# 2. Then in code:
git revert <commit-sha>
git push origin conversion-optimization-phase-1
# 3. Re-publish theme after fix
```

---

## Out of scope for Phase 1 (do NOT touch)

- `sections/product-template.liquid` (orphan, not live).
- `snippets/hov-product-makeover.liquid` (423 lines, rendered at line 590 of the section but not investigated — assume stable).
- `snippets/product-price.liquid` (used by other product surfaces — collection cards, search — out of PDP scope).
- `assets/theme.css.liquid` (no edits — all PDP CSS stays scoped inside the section's `<style>` block).
- All other sections in `templates/product.json` (FAQ, comparison table, store features, recommendations) — Phase 1 is the section above the fold only.
- Cart, checkout, header, footer — Phase 2+.

---

## Action items / open questions for you before implementation

1. **Confirm precondition 0.3** — should I add a real price block (recommended) or work around the missing one?
2. **Confirm the 4 / 3-pill split in Change 4** — re-purpose existing `badge_1..4` for emotional positioning, put functional benefits in the new 3-bullet row?
3. **Backup the live section** — add `sections/hov-product-conversion.liquid` to `backup-original/` before any edits start. (The original backup folder only mirrored what you originally listed; the live section was missed because we didn't know it was the target until the audit was done.)
4. **Localization scope** — defaults in this plan are English. Is multi-locale a Phase 1 requirement or Phase 2?
5. **Metafield creation** — Phase 1 references new `product.metafields.custom.*` fields (`cod_disabled`, `delivery_min`, `delivery_max`, `low_stock_threshold`). These need to be defined in Shopify admin → Settings → Metafields **before** the merchant can use them. Is that your job or mine?

---

*End of plan — awaiting your review.*
