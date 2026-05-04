# Product Page Audit — Read-Only Report

**Branch:** `conversion-optimization-phase-1`
**Date:** 2026-04-30
**Scope:** `sections/product-template.liquid`, `snippets/product-price.liquid`, `templates/product.json`, `assets/`

---

## ⚠️ Critical Finding: Live PDP uses a different section

`templates/product.json` (`order[0] = "product"`) wires the main product slot to:

```json
"product": { "type": "hov-product-conversion" }
```

→ The live product page renders `sections/hov-product-conversion.liquid`, **not** `sections/product-template.liquid`. The latter is still in the codebase and fully functional, but unless you switch the template back, edits to `product-template.liquid` will not appear on the storefront.

**Recommendation before Phase 1 changes:** decide whether the conversion work should
- (a) modify `hov-product-conversion.liquid` (the live section), or
- (b) replace it by repointing `product.json` back to `product-template`, then optimize `product-template.liquid`.

The rest of this audit covers `product-template.liquid` as requested. A follow-up audit of `hov-product-conversion.liquid` is recommended if option (a) is chosen.

---

## 1. `sections/product-template.liquid` (2,709 lines)

### 1.1 Block types declared in schema (15 block types)

Schema definition order (this is the order they appear in the theme editor's "Add block" menu, **not** the render order — render order is controlled per-template):

| # | `type` | Purpose | `limit` |
|---|---|---|---|
| 1 | `hr` | Divider | — |
| 2 | `title` | Product title (H1) | 1 |
| 3 | `price` | Price + sale / "you save" + tax/shipping note + payment terms | 1 |
| 4 | `vendor` | Vendor name or vendor logo | 1 |
| 5 | `shortdes` | Description (short / full / metafield) | 1 |
| 6 | `variants` | Variant picker (renders `variant-picker` snippet) | 1 |
| 7 | `wishlist` | Wishlist link + "ask about product" + "shipping info" links | 1 |
| 8 | `cta` | Quantity input + Add-to-Cart + dynamic checkout / **"BUY IT NOW"** + back-in-stock | 1 |
| 9 | `countdown` | Sales-end countdown timer | 1 |
| 10 | `img` | **Trust-badge image block** (admin-uploaded image + title) | — |
| 11 | `text` | Generic richtext block | — |
| 12 | `ras` | Rating + Availability + SKU row | 1 |
| 13 | `coltabs` | Collapsible tab (description / size chart / richtext) | — |
| 14 | `ftext` | Featured-text with icon | — |
| 15 | `pco` | Product custom options (renders `custom-options` snippet) | — |

Additional block types implemented in the case-statement but not all listed above: `order`, `visitor`, `qty`, `freeship`, `shiptime`, `pickup`, `customc`, `ft` (store features 1-4), `type`, `cl` (collection), `tags`, `complementary`, `more-color`, `@app`.

> **No `presets` array** is defined in the schema → the section has no default block order; whatever is in `templates/product.json` controls render order (and currently `product.json` doesn't render this section at all — see top callout).

### 1.2 Where the key elements live

| Element | File:lines | Notes |
|---|---|---|
| **Price block** | `sections/product-template.liquid:202-257` | `<div id="price-{{ section.id }}" class="psinglePriceWr">`. Renders `current_variant.price` via `money` or `money_with_currency` filter. Includes "regular_price" v-hidden label, sale `<s>` strikethrough, "you save" badge (lines 223-230), `unit_price_measurement`, `payment_terms`, optional tax/shipping policy. Hidden when `product.metafields.custom.product_group` is present. |
| **Buy button** | `sections/product-template.liquid:482-555` | `<product-form>` web-component wrapping a Shopify `{% form 'product' %}`. ATC button id `ProductSubmitButton-{{ section.id }}` at line 522. Custom **"BUY IT NOW"** secondary button at line 545 (`#flo-buy-now-button`, calls `handleFloBuyNowBtn`). Optional `terms_checkbox` and `dynamic_btn`. Renders `hov-product-makeover` snippet after the form. |
| **Description (shortdes block)** | `sections/product-template.liquid:658-667` | Three modes: `shortd` (truncates `product.description` by `blkSt.lmt` words), `fulld` (full `product.description`), `meta` (renders `product.metafields.my_fields.short_des`). |
| **Description (coltabs block)** | `sections/product-template.liquid:302-326` | `<details>` element; can render description, size chart (metafield → page → fallback page), or arbitrary richtext. |
| **Sale / custom badges** | `sections/product-template.liquid:145-158` | Inside the media gallery overlay (`<span class="product-labels">`). Three configurable tag-driven badges (`pr_label1/2/3`) + auto sale badge (text "ON SALE" or `-XX%`). |
| **Discount-saved badge** | `sections/product-template.liquid:223-230` | `<span class="discount-badge">` next to price showing absolute saved amount + "% off". |
| **Trust-badge block** | `sections/product-template.liquid:696-705` (`when 'img'`) | `<div class="trust_badge">`. Admin uploads the image; default text in schema is `"GUARANTEED SAFE CHECKOUT"`. **No bundled trust-badge image asset exists** — the merchant must upload one. |
| **Rating row** | `sections/product-template.liquid:275-301` (`when 'ras'`) | Includes `'ratings'` snippet, availability label (in stock / pre-order / sold out), SKU. |

### 1.3 Metafields used (15 references)

| Metafield | Used at | Purpose |
|---|---|---|
| `product.metafields.custom.color_group` | line 67 | Switches gallery to grouped-color media |
| `product.metafields.custom.product_group` | 203, 371, 388 | Suppresses the standard price + wishlist + CTA blocks; renders `products-group` snippet instead |
| `product.metafields.my_fields.video` | 139 | URL for the magnific-popup product video |
| `product.metafields.my_fields.sizechart` | 311, 312, 780, 781 | Per-product size-chart override (richtext) |
| `product.metafields.my_fields.countdown` | 566, 569 | Per-product countdown end-date (gates the countdown block) |
| `product.metafields.my_fields.shipping_days` | 625, 626 | Per-product shipping-time range, format `"min/max"` |
| `product.metafields.my_fields.short_des` | 665 | Custom short-description text |
| `product.metafields.loox.{avg_rating, num_reviews}` | 884, 885 | JSON-LD aggregateRating (Loox) |
| `product.metafields.yotpo.{reviews_average, reviews_count}` | 890, 891 | JSON-LD aggregateRating (Yotpo) |
| `product.metafields.judgeme.badge` | 894, 895 | Parsed via `split` to extract Judge.me rating + count |
| `product.metafields.reviews.{rating.value, rating_count}` | 901, 904, 905 | JSON-LD aggregateRating (Shopify Reviews) |

**Plus, used in `templates/product.json` by the live `hov-product-conversion` section** (referenced in inline custom-liquid):
- `product.metafields.custom.product_tags` (CSV)
- `product.metafields.custom.subtitle`
- `product.metafields.custom.material_info` (CSV)
- `product.metafields.custom.why_buy` (newline-separated bullets)
- `product.metafields.custom.guarantee_text` (defaults to `"6 Months Anti-Tarnish Guarantee"`)

### 1.4 Hardcoded text needing localization

The vast majority of strings already use `{{ 'foo.bar' | t }}`. The following are **NOT** translated and will need locale entries before launch in another language:

| Where | Line | String | Severity |
|---|---|---|---|
| `sections/product-template.liquid` | 546 | `{{ 'BUY IT NOW' }}` (Liquid output of literal string — visible button copy) | **High** |
| `sections/product-template.liquid` | 1405 | Schema default: `"Hurry up! Sales End In"` (countdown label) | Medium (merchant-editable) |
| `sections/product-template.liquid` | 1486 | Schema default: `"<span class='fw-500'>GUARANTEED SAFE CHECKOUT</span>"` (trust-badge title) | Medium |
| `sections/product-template.liquid` | 1546 | Schema default: `"<p>Text block</p>"` (placeholder) | Low |
| `sections/product-template.liquid` | 1663 | Schema default: `"Care Instructions"` (collapsible tab title) | Medium |
| `sections/product-template.liquid` | 1689 | Schema default: lorem-ipsum richtext | Low |
| `sections/product-template.liquid` | 2614 | Schema default: `"<p>Return within 30 days of purchase Duties & taxes are non-refundable. Returns Details.</p>"` | Medium |
| `sections/product-template.liquid` | various option labels | `"Light"`, `"Regular"`, `"Medium"`, `"Semi Bold"`, `"Bold"`, `"Style 1/2"`, `"Font 1/2/3"` | Low (theme-editor only) |
| `templates/product.json` (hov section) | 16 | `"badge_text": "✨ Bestseller"` | High (live-visible) |
| `templates/product.json` (hov section) | 17 | `"subtitle": "A delicate statement for everyday elegance."` | High |
| `templates/product.json` (hov section) | 19 | `"review_text": "Loved by women for everyday wear"` | High |
| `templates/product.json` (hov section) | 21 | `"tax_text": "Inclusive of taxes. Free shipping on prepaid orders."` | High |
| `templates/product.json` store-features block | 395-423 | `"EASY RETURNS"`, `"24/7 SUPPORT"`, `"FREE SHIPPING"`, `"SECURE PAYMENTS"` + descriptions | Medium |
| `templates/product.json` various | 142, 358, 466-494, 532, 548 | `"FREQUENTLY BOUGHT TOGETHER"`, `"EXPLORE MORE"`, `"PRODUCT DETAILS"`, `"SPECIFICATIONS"`, `"REVIEWS"`, `"SHIPPING & RETURNS"`, `"RECOMMENDED PRODUCTS"`, `"RECENTLY VIEWED PRODUCTS"` | Medium |
| `templates/product.json` comparison-table | 249-305 | `"Faster Delivery"`, `"Great Customer Support"`, `"Trendiest Designs"`, etc. (8 rows) | Medium |

`snippets/product-price.liquid` — all user-visible strings are localized.

---

## 2. Assets folder

### 2.1 Main stylesheet

- **Primary CSS:** `assets/theme.css.liquid` (115,843 B / ~116 KB) — **plain CSS-in-Liquid, not SCSS**. Shopify deprecated SCSS some years ago; this theme followed suit.
- **RTL variant:** `assets/themeRtl.css.liquid`
- **Other stylesheets:** `assets/default.css.liquid`, `assets/defaultRtl.css.liquid`, `assets/component-rte.css`, `assets/photoswipe.css.liquid`, `assets/gift-card.css.liquid`, `assets/admin.css`, `assets/model-viewer-ui.css`
- **No `*.scss*` files exist** — verified via glob.

### 2.2 Icon system

- **Primary icon set:** custom **Adorn icon font** (`adorn-icons.ttf` / `.woff` / `.woff2`).
  Usage pattern: `<i class="at at-icon-name"></i>` — e.g., `at-video`, `at-truck-l`, `at-heart-l`, `at-envelope-l`, `at-paper-l-plane`, `at-ruler`, `at-angle-down-l`, `at-minus-r`, `at-plus-r`, `at-circle-notch-r`, `at-undo-r`, `at-phone-24`, `at-ship-fast`, `at-payment-security`. ~11 references in `product-template.liquid` alone.
- **Inline SVGs:** used for the 3D-model play button, video play button, and Flickity prev/next arrows in the gallery (lines 116, 174, 175, 181, 182).
- **No SVG sprite** (e.g. `icons.svg`) detected.
- **No Font Awesome.**

### 2.3 Trust-badge / payment-icon images

**None bundled.** Verified by glob (`*trust*`, `*badge*`, `*pay*`, `*secur*`, `*guarantee*` — no matches in `assets/` or `snippets/`).

The `img` trust-badge block expects the merchant to upload an image via the theme editor's image picker. Default schema title is the literal string `"GUARANTEED SAFE CHECKOUT"`.

For Phase 1 trust signals, you'll either need to:
- ship trust-badge SVGs/PNGs into `assets/` and reference them, **or**
- reuse the Adorn icons (`at-payment-security`, `at-ship-fast`, `at-undo-r`, `at-lock`, etc.) which already render the existing `store-features` row.

### 2.4 Other notable image assets

Decorative / promotional only — no security/trust imagery:
`fire.png`, `snow-1.png`, `snow-2.png`, `snow-3.png`, `snowballs-{sm,md,lg}.png`, `soldout.png`, `sec-ttl3.svg`, `loader.svg`, `ajax-loader.gif`, `arrow-select.png`, `default-skin.{png,svg}`, `ico-select.svg.liquid`, `spacer.png`.

### 2.5 JavaScript inventory (top-of-mind)

`theme.js`, `theme.min.js`, `vendor.js`, `custom.js`, `customer.js`, `jquery.min.js` (theme depends on jQuery), `jquery.currencies.min.js`, `jquery.range-min.js`, `lazysizes.js`, `photoswipe.{min,lightbox.min}.js`, `script-loader.js`, `wow.min.js`, `stellar.js`, `masonry.js`, `js.cookie.js`, `show-more.js`, `price-per-item.js`, `product-group.js`, `product-model.js`, `recipient-form.js`, `shipping-calculator.js`, `upsell-bundle.js`, `gift-card.js`, `password.js`, `admin.js`.

---

## 3. Snippets touching the PDP (referenced from `product-template.liquid`)

`breadcrumb`, `lazyload`, `media-gallery-group`, `social-sharing`, `ratings`, `variant-picker`, `products-group`, `custom-options`, `back-in-stock`, `complementary`, `more-colors`, `gift-card-recipient-form`, `hov-product-makeover`, `product-popup`, `icon-loading`.

---

## 4. Phase-1 risks / things to watch

1. **Wrong-file edits:** the live PDP renders `hov-product-conversion`, not `product-template`. Confirm scope before any edit.
2. **No SCSS pipeline:** all CSS edits go directly into `theme.css.liquid` (single 116 KB file). No source maps; manual minification.
3. **jQuery dependency:** the theme is jQuery-based (Magnific Popup, Flickity bound through jQuery, custom.js). Avoid introducing a competing modern stack.
4. **Hardcoded "BUY IT NOW" string** at line 546 needs to be wrapped in `| t` if multi-locale support is planned.
5. **Trust-badge content lives in two places:** the `img` block in `product-template.liquid` (image-based) and the `store-features` section in `product.json` (icon + text). Pick one canonical surface.
6. **No bundled trust-badge / payment-icon assets** — Phase 1 will need new assets or rely on Adorn icon font.
7. **Multiple review-app integrations** wired into JSON-LD (Loox, Yotpo, Judge.me, Shopify Reviews) — confirm which app is actually installed before shipping conversion changes that depend on review counts.

---

*End of report — no source files modified.*
