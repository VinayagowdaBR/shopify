# Metafields to Create in Shopify Admin

> Path: **Shopify Admin → Settings → Custom data → Products → Add definition**
> Namespace and key are entered as separate fields. Use namespace `custom` for all of these.
> Branch context: `conversion-optimization-phase-1` — this list covers what the active PDP (`sections/hov-product-conversion.liquid` + `snippets/hov-product-makeover.liquid`) reads.

---

## Active PDP metafields (Phase 1 — required)

Create these five. Each one is read by the new product page; if missing, the page falls back to either an empty value (no rendering) or a hard-coded default.

| # | Namespace | Key | Type | Sample value | What it does | Read at |
|---|-----------|-----|------|--------------|--------------|---------|
| 1 | `custom` | `product_tags` | Single line text | `Bestseller, Hot Selling, Limited Deal` | Comma-separated list of pills shown above the price. Built-in styles for `bestseller`, `hot`/`trending`, `limited`/`flash`/`deal`, `new`. Anything else uses a default purple pill. | `snippets/hov-product-makeover.liquid:40`, `:274-292` |
| 2 | `custom` | `subtitle` | Single line text | `A delicate statement for everyday elegance.` | Italic subtitle inserted right under the product title. | `snippets/hov-product-makeover.liquid:41`, `:266-271` |
| 3 | `custom` | `material_info` | Single line text | `100% 304 Stainless Steel, 18K Gold Plated` | Comma-separated material badges shown above the buy buttons. Built-in icon styles for `gold`, `copper`; anything else uses the steel/default style. Leave blank to hide the row. | `snippets/hov-product-makeover.liquid:42`, `:301-313` |
| 4 | `custom` | `why_buy` | Multi-line text | `Waterproof / Sweat-proof`<br>`Skin-friendly / Hypoallergenic`<br>`Daily wear safe` | One bullet per line in the "Why you'll love it" box below the buy buttons. Leave blank to hide the box. | `snippets/hov-product-makeover.liquid:43`, `:339-348` |
| 5 | `custom` | `guarantee_text` | Single line text | `6 Months Anti-Tarnish Guarantee` | Per-product override for the top guarantee badge. If blank, the section setting `guarantee_badge_text` (default `"6-Month Anti-Tarnish Guarantee"`) is used. | `sections/hov-product-conversion.liquid:50`, `snippets/hov-product-makeover.liquid:44` |

### Settings to use in the definition form

For all five definitions:

- **Name:** human-readable (e.g. "Product tags", "Subtitle", "Material info", "Why buy", "Guarantee text")
- **Namespace and key:** `custom.<key>` (e.g. `custom.product_tags`)
- **Type:** as listed in the table above
- **Validations:** none required for Phase 1
- **Storefronts:** ✅ enabled (must be on, otherwise Liquid can't read it)
- **One value / List of values:** **One value** for all five (the comma/newline parsing happens in Liquid)

---

## Already-plumbed legacy metafields (do NOT recreate)

The legacy theme files reference these. They may already exist in the store from prior themes — check before adding. None of them are required by the new PDP, but they're still wired in `sections/product-template.liquid` and other sections:

- `custom.color_group`
- `custom.product_group`
- `custom.more_colors`
- `custom.faqs`

If they don't exist and you're not using legacy sections, ignore them.

---

## New "Extras" sections metafields (below product info)

These five drive the full-width sections rendered **below the product image + buy buttons** in `sections/hov-product-conversion.liquid`. Each section appears only when its metafield has a value — leave any blank to hide that section.

| # | Namespace | Key | Type | Sample value | What it renders |
|---|-----------|-----|------|--------------|-----------------|
| 6 | `custom` | `product_highlights` | Multi-line text | `Versatile Style \| Pairs with both ethnic and western outfits`<br>`Lightweight Feel \| Comfortable for all-day wear`<br>`Adjustable Fit \| Fits all body types comfortably` | Card grid below the product. **One highlight per line**, format: `Title \| Description`. The pipe `\|` separates title from description; description is optional. Each card is auto-numbered (01, 02, …). |
| 7 | `custom` | `styling_tips` | Multi-line text | `Pair with a saree for traditional events.`<br>`Layer over a kurta for festive looks.`<br>`Wear over a plain top + jeans for everyday glam.` | Free-form prose. Each newline becomes a paragraph break. |
| 8 | `custom` | `material_care` | Multi-line text | `Material: 18K Gold Plated on 304 Stainless Steel.`<br>`Care: Wipe with a soft dry cloth after wear.`<br>`Avoid contact with water, perfume, and chemicals.` | Free-form prose. Newlines = paragraph breaks. |
| 9 | `custom` | `box_contents` | Multi-line text | `1 × Karnatbelt`<br>`Premium gift box`<br>`Care card`<br>`Authenticity certificate` | Two-column checklist. **One item per line.** Each item gets a green tick icon. |
| 10 | `custom` | `pro_tip` | Single line text | `Store in the gift box when not worn to maintain shine.` | Cream-coloured banner with a "PRO TIP" pill. |

### Settings to use for the extras definitions

- **Name:** human-readable (e.g. "Product highlights", "Styling tips", "Material & care", "Box contents", "Pro tip")
- **Namespace and key:** `custom.<key>` as listed above
- **Type:** as listed in the table
- **Storefronts:** ✅ enabled
- **One value / List of values:** **One value** (newline parsing happens in Liquid)

---

## After creating

1. Open any product → scroll to the **Metafields** card at the bottom of the product editor.
2. Fill in values for the metafields you want to use (per product — they're not bulk-defaultable).
3. Reload the PDP on the storefront. Each metafield with a value will appear; blank ones stay hidden (except `guarantee_text`, which falls back to the section default).

## Sanity check before going live

- [ ] All metafield definitions show "Storefront access: enabled"
- [ ] At least one product has each metafield filled in
- [ ] PDP renders the tags row, subtitle, material badges, why-buy box, and top guarantee badge
- [ ] PDP renders the new extras sections (highlights cards, styling, material/care, box list, pro tip)
- [ ] No duplicate guarantee pill below the price (see Q2 deletion task)
