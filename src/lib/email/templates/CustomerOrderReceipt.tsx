// src/lib/email/templates/CustomerOrderReceipt.tsx
// React Email template: customer order confirmation / receipt.
//
// Data contract:
//  - order:  Order (from src/types/index.ts)
//  - items:  OrderItem[]
//  - nextDeliveryDate: ISO date string (YYYY-MM-DD)
//
// All prices are stored as integer NGN (naira); display formats directly.

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from "react-email";
import * as React from "react";

import type { Order, OrderItem } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNgn(naira: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(naira);
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const main: React.CSSProperties = {
  backgroundColor: "#fffaf5",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const container: React.CSSProperties = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "600px",
};

const headerSection: React.CSSProperties = {
  backgroundColor: "#c8501a",
  borderRadius: "8px 8px 0 0",
  padding: "32px 40px",
  textAlign: "center" as const,
};

const brandName: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "26px",
  fontWeight: "700",
  margin: "0",
};

const brandTagline: React.CSSProperties = {
  color: "#fddbc8",
  fontSize: "13px",
  margin: "6px 0 0",
};

const contentSection: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "0 0 8px 8px",
  padding: "32px 40px",
  border: "1px solid #ede0d4",
  borderTop: "none",
};

const h1: React.CSSProperties = {
  color: "#1a1a1a",
  fontSize: "22px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const paragraph: React.CSSProperties = {
  color: "#444",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const refBox: React.CSSProperties = {
  backgroundColor: "#fff7f2",
  border: "1px solid #f5c5a0",
  borderRadius: "6px",
  padding: "12px 16px",
  margin: "0 0 24px",
};

const refLabel: React.CSSProperties = {
  color: "#888",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  margin: "0 0 4px",
};

const refValue: React.CSSProperties = {
  color: "#c8501a",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0",
};

const sectionHeading: React.CSSProperties = {
  color: "#1a1a1a",
  fontSize: "13px",
  fontWeight: "700",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  margin: "0 0 12px",
  paddingBottom: "8px",
  borderBottom: "1px solid #ede0d4",
};

const itemRow: React.CSSProperties = {
  paddingBottom: "10px",
  marginBottom: "10px",
  borderBottom: "1px solid #f5ede6",
};

const itemName: React.CSSProperties = {
  color: "#1a1a1a",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 2px",
};

const itemMeta: React.CSSProperties = {
  color: "#888",
  fontSize: "12px",
  margin: "0",
};

const itemPrice: React.CSSProperties = {
  color: "#1a1a1a",
  fontSize: "14px",
  fontWeight: "600",
  textAlign: "right" as const,
  margin: "0",
};

const totalRow: React.CSSProperties = {
  paddingTop: "12px",
};

const totalLabel: React.CSSProperties = {
  color: "#1a1a1a",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0",
};

const totalValue: React.CSSProperties = {
  color: "#c8501a",
  fontSize: "18px",
  fontWeight: "700",
  textAlign: "right" as const,
  margin: "0",
};

const infoGrid: React.CSSProperties = {
  margin: "0 0 24px",
};

const infoLabel: React.CSSProperties = {
  color: "#888",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  margin: "0 0 2px",
};

const infoValue: React.CSSProperties = {
  color: "#1a1a1a",
  fontSize: "14px",
  margin: "0 0 16px",
};

const deliveryCallout: React.CSSProperties = {
  backgroundColor: "#f0faf0",
  border: "1px solid #b8ddb8",
  borderRadius: "6px",
  padding: "14px 16px",
  margin: "0 0 24px",
};

const deliveryText: React.CSSProperties = {
  color: "#1a6e1a",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
};

const footer: React.CSSProperties = {
  color: "#aaa",
  fontSize: "12px",
  lineHeight: "18px",
  textAlign: "center" as const,
  margin: "32px 0 0",
};

const ctaWrap: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#c8501a",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "700",
  padding: "13px 30px",
  textDecoration: "none",
};

const ctaHint: React.CSSProperties = {
  color: "#999",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "10px 0 0",
};

// ─── Component ───────────────────────────────────────────────────────────────

export interface CustomerOrderReceiptProps {
  order: Order;
  items: OrderItem[];
  nextDeliveryDate: string; // ISO YYYY-MM-DD
  contactEmail: string;
  /** One-click link back to this order. Omitted when it can't be built. */
  trackUrl?: string | null;
}

export function CustomerOrderReceipt({
  order,
  items,
  nextDeliveryDate,
  contactEmail,
  trackUrl,
}: CustomerOrderReceiptProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your Rodo &amp; Co order {order.reference} is confirmed — delivery on{" "}
        {formatDate(nextDeliveryDate)}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={brandName}>Rodo &amp; Co</Text>
            <Text style={brandTagline}>Fresh ingredients, prepared your way</Text>
          </Section>

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={h1}>Order Confirmed</Heading>
            <Text style={paragraph}>
              Hi {order.customer_name}, thank you for your order! We&apos;ve received your payment
              and your fresh ingredients will be ready for delivery this Saturday.
            </Text>

            {/* Reference */}
            <Section style={refBox}>
              <Text style={refLabel}>Order Reference</Text>
              <Text style={refValue}>{order.reference}</Text>
            </Section>

            {/* Delivery callout */}
            <Section style={deliveryCallout}>
              <Text style={deliveryText}>
                Estimated delivery: {formatDate(nextDeliveryDate)}
              </Text>
            </Section>

            {/* Primary action: one-click back into this order's live status */}
            {trackUrl && (
              <Section style={ctaWrap}>
                <a href={trackUrl} style={ctaButton}>
                  Track your order →
                </a>
                <Text style={ctaHint}>
                  Opens your order status — no password needed. Link valid for 7 days.
                </Text>
              </Section>
            )}

            {/* Order items */}
            <Text style={sectionHeading}>Your Order</Text>
            {items.map((item) => (
              <Row key={item.id} style={itemRow}>
                <Column>
                  <Text style={itemName}>
                    {item.quantity} × {item.product_name}
                  </Text>
                  <Text style={itemMeta}>
                    {[item.variant_label, item.prep_option].filter(Boolean).join(" · ") || "Standard"}
                  </Text>
                </Column>
                <Column>
                  <Text style={itemPrice}>{formatNgn(item.subtotal_ngn)}</Text>
                </Column>
              </Row>
            ))}

            <Hr style={{ borderColor: "#c8501a", margin: "0 0 12px" }} />
            <Row style={totalRow}>
              <Column>
                <Text style={totalLabel}>Total</Text>
              </Column>
              <Column>
                <Text style={totalValue}>{formatNgn(order.total_ngn)}</Text>
              </Column>
            </Row>

            {/* Delivery details */}
            <Hr style={{ borderColor: "#ede0d4", margin: "24px 0" }} />
            <Text style={sectionHeading}>Delivery Details</Text>
            <Section style={infoGrid}>
              <Text style={infoLabel}>Name</Text>
              <Text style={infoValue}>{order.customer_name}</Text>

              <Text style={infoLabel}>Phone</Text>
              <Text style={infoValue}>{order.customer_phone}</Text>

              <Text style={infoLabel}>Delivery Address</Text>
              <Text style={infoValue}>{order.delivery_address}</Text>

              {order.allergy_notes && (
                <>
                  <Text style={infoLabel}>Allergy Notes</Text>
                  <Text style={infoValue}>{order.allergy_notes}</Text>
                </>
              )}
            </Section>

            <Text style={paragraph}>
              Questions? Reply to this email or contact us at{" "}
              <a href={`mailto:${contactEmail}`} style={{ color: "#c8501a" }}>
                {contactEmail}
              </a>
              .
            </Text>
          </Section>

          {/* Footer */}
          <Text style={footer}>
            Rodo &amp; Co · Fresh food prep, delivered to you every Saturday
            <br />
            You received this email because you placed an order on rodoandco.com
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default CustomerOrderReceipt;
