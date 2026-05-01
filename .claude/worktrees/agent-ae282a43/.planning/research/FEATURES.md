# Feature Landscape

**Domain:** Food prep ordering platform (fresh produce + cooking kits, weekly delivery cycle)
**Market:** Nigeria (NGN / Paystack / mobile-first)
**Researched:** 2026-04-15
**Confidence:** MEDIUM-HIGH (WebSearch + official UX sources; Nigeria-specific confirmed via market research)

---

## Table Stakes

Features users expect. Missing = product feels broken or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Product grid / shop page | First thing users look for; no shop = nothing to buy | Low | Clear product photos, name, price, brief description. Lazy-load images for NG mobile networks. |
| Product configuration drawer | Industry standard (Chowdeck, HelloFresh both use slide-in/bottom sheet pattern); quantity + variant selection in context | Medium | Bottom sheet on mobile (thumb-friendly). Must show live price recalculation as options change. Do NOT navigate away from the shop page. |
| Quantity selector with live price | Users expect immediate feedback when changing quantity or prep option | Low | +/- stepper is table stakes. Show unit price and running total inline. |
| Cart with item editing | Users change their mind; inability to edit forces order restart = abandonment | Medium | Persistent across page refreshes (localStorage). Must support remove, quantity change, and return to shop. |
| Order cutoff visibility | Weekly window is the core mechanic — if the cutoff is invisible, users are confused or caught out | Low | Prominent banner on shop page. Disabled add-to-cart state when closed. Clear "orders open Sunday, close Thursday" messaging. |
| Guest checkout (no-account) | 26% of users abandon if forced to register. Nigerian mobile shoppers especially friction-averse. This platform already decided no-account. | Low | Collect only what's operationally necessary: name, phone, email, delivery address, allergy notes. |
| Paystack inline payment | Paystack is the trusted local gateway; Nigerian users recognize the Paystack popup as a trust signal. Redirecting to an unknown payment page increases drop-off. | Medium | Inline popup (not redirect). HMAC webhook verification required. Handle network failures with clear retry messaging. |
| Order confirmation page | Users need proof the order went through — especially after any payment hiccup | Low | Fetched by Paystack reference. Show order summary, items, total, expected delivery date (next Saturday). |
| Transactional email confirmation | Nigerian users expect a paper trail. Email is the standard backup confirmation channel. | Low | Fires on successful Paystack webhook via Resend. Include full order summary + Saturday delivery date. |
| Mobile-responsive layout | 70%+ of Nigerian ecommerce transactions happen on smartphones. Mobile-broken = unusable for the primary audience. | Low (with Tailwind) | Design mobile-first throughout. Minimum 44px touch targets on all interactive elements. |
| Allergy / dietary notes field | Food product. Users with allergies need a relief valve even if the platform can't formally handle substitutions. | Low | Free-text field at checkout. Admin sees it on the order row. |

---

## Differentiators

Features that distinguish Rodo & Co. A good differentiator is achievable, meaningful to the customer, and not yet table stakes in this market.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Prep style options (sliced, diced, whole, etc.) | The core product innovation. HelloFresh doesn't do this — they assume customers prep everything. Rodo & Co removes a pain point specific to Nigerian home cooks who may want pre-prepped ingredients. | Medium | Options are per-product and per-variant (configured by admin). Shown in the product drawer. Price may vary by prep option. |
| Saturday delivery ritual branding | Positioning the weekly Saturday delivery as a household ritual ("Your Saturday prep, sorted") is a hook HelloFresh uses effectively. Turns a logistical feature into a brand identity. | Low (copy/design) | Landing page hero + "how it works" section. Order confirmation reinforces the Saturday date. |
| Kit size options (serves 2, serves 4, etc.) | Household sizing is expected in the kit category but not universal in Nigerian grocery delivery. Directly reduces waste guilt. | Medium | Handled as product variants. Variant selection in the product drawer. Price scales with size. |
| Admin-triggered delivery reminders | Proactive reminder before Saturday delivery creates trust and reduces "where's my order?" support volume. | Low | Admin triggers from orders view; Resend email to all paid orders for that week. Not automatic to customer (admin decides timing). |
| Cutoff-state as UI behaviour | Most NG grocery platforms don't communicate ordering windows clearly. Making the cutoff state a first-class UI element (banner, disabled states, messaging) is a UX differentiator in this market. | Low | `ordering_config` master switch. Banner changes copy. Cart button disabled. Checkout page shows closed-state message. |
| Prep instruction notes on admin orders view | The prep options a customer selected need to reach the kitchen team clearly. Expandable order rows with prep instructions per item is a kitchen-facing feature that reduces fulfillment errors. | Low | Already in the admin spec. Surfacing this in the order view cleanly is the differentiator. |

---

## Anti-Features

Things to deliberately NOT build at MVP. These are complexity traps that look reasonable but will derail a 3-week build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Customer accounts / profiles | 26% of checkouts abandon at registration walls. The decision is already made: no accounts. Adding accounts means auth flows, password resets, session management, profile editing, order history fetch — minimum 1 extra week. | Guest checkout with email confirmation as the receipt. If repeat customers are a retention lever, solve it post-launch. |
| Subscription / auto-renewal model | Subscription fatigue is the #1 churn driver for meal kit platforms globally. Managing pause, skip, resume, and cancellation is a product in itself. HelloFresh has burned significant engineering here. | One-time orders per week. If customers love it, they come back manually. That is also a validation signal. |
| Real-time order tracking / rider map | This is on-demand food delivery UX (Chowdeck pattern). Rodo & Co is a scheduled weekly delivery — there is no rider to track until Saturday. Customers already know the delivery date. | Saturday delivery date on the confirmation page and reminder email handles 90% of the anxiety this feature would solve. |
| WhatsApp order channel | Most small Nigerian food businesses take orders via WhatsApp. That works at 20 orders/week, breaks at 200. Building the web platform IS the escape from WhatsApp ordering. Don't add WhatsApp as a parallel channel at launch. | The platform is the channel. Admin email alert on new order is the only ops notification needed at MVP. |
| Discount codes / promo system | Coupon infrastructure requires code storage, validation, expiry logic, redemption tracking, and display in cart + checkout. Typically 2-3 days of work minimum. | Launch without discounts. Run launch promotions manually (price the product as if discounted). Add coupons in Phase 2 once the core order flow is proven. |
| Product reviews / ratings | Adds read/write infrastructure, moderation consideration, and display components. No trust signal value at launch with low order volume. | Social proof at launch: a single curated testimonial section on the landing page. |
| Dietary filter system | Filter-by-diet (vegan, halal, gluten-free) requires tagging every product, building filter UI, and maintaining tags as catalog grows. | Allergy notes field at checkout handles immediate safety need. Dietary tags can be added when catalog grows to 20+ products. |
| Multi-address / address book | Requires customer accounts to be useful. | Single delivery address per order at checkout. |
| Inventory / stock level tracking | The PROJECT.md explicitly excludes this. Admin manages availability via `is_active` flag. Real inventory tracking requires stock deduction logic, race condition handling, and low-stock alerts. | `is_active` flag is enough for an MVP with a managed catalog. |
| SMS notifications | Adding an SMS gateway (Termii, Twilio Nigeria) means another vendor, API key, billing account, and message template approval. Email covers confirmation; admin reminder email covers delivery notification. | Transactional email via Resend is sufficient. SMS can be added if email open rates prove insufficient post-launch. |
| Payment method variety (bank transfer, USSD, wallet) | Paystack inline already supports card, bank transfer, and USSD in its popup — zero extra work needed. Do not build custom bank transfer handling outside Paystack. | Let Paystack's inline popup handle all method selection. No custom payment method UI. |

---

## Feature Dependencies

```
Product catalog (active products, variants, prep options)
  → Product grid renders
    → Product drawer shows correct options and price
      → Cart accumulates items
        → Checkout form collects delivery details
          → Paystack inline payment fires
            → Webhook confirms payment → Order created in DB
              → Customer confirmation email fires
              → Admin new-order alert email fires
              → Order appears in admin orders view

ordering_config (is_open flag)
  → Cutoff banner shows correct state
  → Add-to-cart button enabled/disabled
  → Checkout page accessible or blocked
  → Vercel Cron flips is_open false Thursday 22:59 UTC

Admin auth
  → Orders view (with prep instructions, status updates, CSV export)
  → Product management (CRUD, image upload)
  → Delivery reminder trigger (emails all paid orders for week)
  → Analytics dashboard (order count, revenue, top products)
```

---

## MVP Recommendation

**Prioritize (must ship to be a real product):**

1. Product grid with cutoff banner — the storefront
2. Product configuration drawer — quantity, size, prep option, live price
3. Cart with localStorage persistence — survives page refresh
4. Guest checkout form — name, phone, email, address, allergy notes
5. Paystack inline payment + webhook → order creation
6. Order confirmation page (by reference)
7. Transactional emails: customer confirmation + admin new-order alert
8. Admin orders view with prep instructions per item
9. Admin product management (CRUD + is_active)
10. Cutoff enforcement UI (banner + disabled states + Vercel Cron)

**Defer (post-launch, not blocking validation):**

- Delivery reminder email trigger (nice-to-have for Week 1 customers, but admin can send manually)
- Analytics dashboard (orders + revenue queryable in Supabase dashboard until a proper view is built)
- Discount / promo codes
- Dietary filter tags
- SMS notifications

---

## Nigerian Market / Mobile-First Notes

- **Network resilience:** Nigerian mobile users experience network drops. Paystack's inline popup handles this reasonably, but the order confirmation page should be fetchable by reference URL so customers can return to it if they lose connection mid-redirect.
- **Phone number field:** Use Nigerian phone format validation (starts with 0 or +234, 11 digits). React Hook Form + Zod pattern: `/^(\+?234|0)[789][01]\d{8}$/`
- **Price display:** Always show ₦ symbol with comma-formatted amounts (₦12,500 not 12500). Stored in kobo, divide by 100 for display. Never show kobo to the user.
- **Touch targets:** 44px minimum on all interactive elements (quantity stepper, add to cart, remove item). Nigerian users predominantly on Android mid-range devices.
- **Image optimization:** Use Next.js `<Image>` with WebP and appropriate `sizes` attributes. Product photography will be the heaviest assets on mobile.
- **Paystack trust signal:** The Paystack popup is widely recognized by Nigerian online shoppers as a legitimate payment interface. Do not try to skin or hide it — it is a trust feature, not a liability.
- **Address field:** Free-text address is appropriate for MVP. Nigerian address formats vary widely. Structured fields (street, LGA, state) can come later if fulfillment requires it.
- **WhatsApp expectation:** Many Nigerian customers expect a WhatsApp contact option for support queries. A WhatsApp link in the footer (linking to a business WhatsApp number) is a low-effort trust signal that does not require building a WhatsApp channel.

---

## Weekly Ordering Window UX Pattern

The ordering window (Sunday open → Thursday midnight WAT close → Saturday delivery) is unfamiliar to first-time users. The UX must make it legible without requiring a user to read documentation.

**Patterns that work (from HelloFresh, Tempo, Green Chef research):**

1. **Countdown banner** — "Orders close Thursday at midnight" with a live countdown on the shop page during the open window. High visibility, creates urgency without being manipulative.
2. **Next delivery date upfront** — Show "Delivering Saturday, [date]" on the shop page header and in the product drawer. Users calculate whether the window works for them before adding anything to cart.
3. **Disabled state with clear explanation** — When ordering is closed, the add-to-cart button is disabled (not hidden) with copy like "Ordering opens Sunday". Users understand the window rather than thinking the product is out of stock.
4. **Order confirmation reinforces the cycle** — The confirmation page and email both state "Your order arrives Saturday, [date]" and "Next ordering window opens Sunday, [date+2]". Seeds the repeat ordering behaviour.

**Anti-pattern to avoid:** Tight cutoff windows with unclear policies are the #1 complaint on HelloFresh and Green Chef. If the cutoff is approaching, the banner should become more prominent, not less. Users who miss the window and don't understand why are high-churn.

---

## Sources

- Fortune / Taste of Home HelloFresh reviews: https://fortune.com/article/hellofresh-review/
- HelloFresh customization (HelloCustom): https://support.hellofresh.com/hc/en-us/articles/115008597367
- Home Chef vs HelloFresh comparison: https://mealbakery.com/home-chef-vs-hellofresh/
- Chowdeck TechCrunch funding/features: https://techcrunch.com/2025/08/11/nigeria-profitable-food-delivery-chowdeck-lands-9m-from-novastar-y-combinator/
- Subscription fatigue / meal kit industry: https://www.modernretail.co/operations/subscription-fatigue-has-hit-meal-kit-companies-hard/
- Baymard guest checkout UX: https://baymard.com/blog/current-state-of-checkout-ux
- Shopify guest checkout conversion data: https://www.shopify.com/enterprise/blog/guest-checkout
- Nigeria ecommerce UX patterns: https://ebrandpromotion.com/best-ux-practices-for-ecommerce-checkout-pages-in-nigeria/
- Nigeria Paystack / mobile checkout: https://ebrandpromotion.com/top-features-every-nigerian-ecommerce-website-must-have-in-2025/
- Cart drawer UX patterns: https://vervaunt.com/ecommerce-cart-drawers-examples-technologies-ux-best-practices
- Nigerian WhatsApp/SMS ordering patterns: https://nairametrics.com/2025/04/13/top-8-food-delivery-apps-in-nigeria-by-user-rating-as-of-march-2025/
- Winning strategies for meal kit subscriptions: https://getrecharge.com/blog/winning-tactics-features-for-the-subscription-meal-kit-industry/
- Nigeria online grocery landscape: https://techpoint.africa/insight/nigeria-online-grocery/
