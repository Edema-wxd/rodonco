// scripts/test-resend.ts
// One-off deliverability check for Resend. Renders the real CustomerOrderReceipt
// template with fake order data and sends it to a recipient you pass in.
//
//   npx tsx scripts/test-resend.ts you@example.com [cc@example.com]
//
// Sends a REAL email. Does not touch the database and writes no email log row.

import "dotenv/config";
import dotenv from "dotenv";
import { render } from "react-email";
import React from "react";
import { Resend } from "resend";

import { CustomerOrderReceipt } from "../src/lib/email/templates/CustomerOrderReceipt";
import type { Order, OrderItem } from "../src/types";

dotenv.config({ path: ".env.local" });

const to = process.argv[2];
const cc = process.argv[3];

if (!to) {
  console.error("Usage: npx tsx scripts/test-resend.ts <recipient@example.com> [cc@example.com]");
  process.exit(1);
}

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM_EMAIL ?? "orders@rodoandco.com";

if (!apiKey) {
  console.error("RESEND_API_KEY is not set — check .env.local");
  process.exit(1);
}

const order: Order = {
  id: "00000000-0000-0000-0000-000000000000",
  reference: "TEST-" + Date.now().toString(36).toUpperCase(),
  customer_name: "Test Customer",
  customer_email: to,
  customer_phone: "+234 800 000 0000",
  delivery_address: "12 Test Close, Lekki Phase 1, Lagos",
  allergy_notes: "No peanuts",
  status: "paid",
  payment_method: "paystack",
  total_ngn: 47500,
  week_of: "2026-10-12",
  created_at: new Date().toISOString(),
  notified_at: null,
};

const items: OrderItem[] = [
  {
    id: "item-1",
    order_id: order.id,
    product_id: "prod-1",
    product_name: "Goat Meat",
    variant_label: "2kg",
    prep_option: "Cut & cleaned",
    quantity: 1,
    unit_price_ngn: 32000,
    subtotal_ngn: 32000,
  },
  {
    id: "item-2",
    order_id: order.id,
    product_id: "prod-2",
    product_name: "Catfish",
    variant_label: "1kg",
    prep_option: "Smoked",
    quantity: 2,
    unit_price_ngn: 7750,
    subtotal_ngn: 15500,
  },
];

async function main() {
  console.log(`Rendering CustomerOrderReceipt (ref ${order.reference})...`);

  const html = await render(
    React.createElement(CustomerOrderReceipt, {
      order,
      items,
      nextDeliveryDate: "2026-10-17",
      contactEmail: from,
      trackUrl: null,
    })
  );

  console.log(`Rendered ${html.length} bytes of HTML.`);
  console.log(`Sending  from: ${from}`);
  console.log(`Sending    to: ${to}`);
  if (cc) console.log(`Sending    cc: ${cc}`);

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to,
    ...(cc ? { cc } : {}),
    subject: `[TEST] Your Rodo & Co order ${order.reference} is confirmed`,
    html,
  });

  if (result.error) {
    console.error("\n❌ Resend rejected the send:");
    console.error(result.error);
    process.exit(1);
  }

  console.log(`\n✅ Accepted by Resend. Message id: ${result.data?.id}`);
  console.log("Check the inbox (and spam folder), plus resend.com/emails for delivery status.");
}

main().catch((err) => {
  console.error("\n❌ Unexpected failure:");
  console.error(err);
  process.exit(1);
});
