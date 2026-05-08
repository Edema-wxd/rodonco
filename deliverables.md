# **Rodo & Co Tech** Deliverables

# **Rodo & Co**

Food prep ordering platform  —  fresh ingredients & cooking kits, weekly Saturday delivery.

| Client | **Rodo & Co** |
| --- | --- |
| Project type | **Web app + Admin panel** |
| Timeline | **3 weeks** |
| Payment | **Paystack** |
| Design meeting | **Pending** |
| Brief version | **v1.0** |

# **01 — Project Scope**

Everything confirmed in the client brief, split by area.

## **Customer-facing (MVP)**

**✓**  Landing page  *— hero section, how it works, CTA button*

**✓**  Shop page  *— fresh produce + cooking kits*

**✓**  Product selection drawer  *— floating panel, no page reload*

**✓**  Cart system  *— add, edit quantity, remove, order summary*

**✓**  Checkout  *— no account required — name, phone, email, address*

**✓**  Allergy declaration + terms agreement  *— on checkout page*

**✓**  Paystack payment integration  *— card + bank transfer*

**✓**  Order confirmation page  *— post-payment summary*

**✓**  Weekly cutoff system  *— orders open Sun–Thu only, banner + block on close*

**✓**  Fully mobile responsive  *— mobile-first build*

## **Admin panel (MVP)**

**✓**  Add / edit products and prices

**✓**  View orders with prep instructions per item

**✓**  Export orders  *— CSV or similar, for market shopping*

**✓**  Order notifications  *— WhatsApp + admin dashboard sync*

**✓**  Trigger delivery reminders to customers  *— from admin dashboard*

**✓**  Basic analytics  *— scope TBD — see open decisions*

## **Non-website deliverables**

**✓**  ~~Business email setup via Zoho  *— hello@rodoandco.com*~~

**✓**  Domain handover at project close

## **Product logic (build-critical)**

**Fresh produce:**

**–**  Sold per portion (like market buying)

**–**  No size options

**–**  User chooses quantity + optional prep style

**Cooking kits:**

**–**  Fixed products

**–**  User chooses size (number of sizes TBD — see open decisions)

**–**  User chooses optional prep style

**Prep options:**

**–**  Vary per product — not a global list

**–**  Examples: sliced, diced, strips, blended

**–**  Complete list must be supplied by client before drawer is built

# **03 — Open Decisions**

These items are vague, unconfirmed, or explicitly pending in the brief. Resolve them early to avoid mid-project delays.

**UI/UX direction not finalised**
Design meeting still pending. References: Hello Fresh, Home Chef, Chowdeck. Direction: clean, minimal, warm, mobile-first. Confirm final moodboard and component style before end of Week 1.

**Cooking kit sizes not confirmed**
~~Brief says 'to be finalised on number of sizes.' Client must confirm how many size options per kit and what they are (e.g. Serves 2 / Serves 4) before the product drawer can be built.~~

**Prep options per product not listed**
~~Prep options vary by product but no master list has been provided. Client must supply the full list before the product drawer and cart logic can be built correctly.~~

**WhatsApp notification method**
Client is open to suggestions. Options: WhatsApp Business API (official, requires Meta approval), Twilio WhatsApp, or WATI. Needs a decision before Week 2 admin work starts.

**Admin analytics scope unclear**
Analytics is listed as a deliverable but undefined. Confirm which metrics matter: daily order count, revenue, popular products, repeat customers? Scope this before Week 3 to avoid creep.

Rodo & Co — Project Brief v1.0  ·  VARYN

[Tech MVP Brief](https://www.notion.so/Tech-MVP-Brief-32cfd9ad53fa80808151e657761a03c7?pvs=21)

[Brand assets](https://www.notion.so/Brand-assets-336fd9ad53fa806e8dd2f0c010c7b2b1?pvs=21)

[Product list ](https://www.notion.so/Product-list-34bfd9ad53fa80869866fcf2f32d5a11?pvs=21)