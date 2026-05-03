// src/lib/email/templates/AdminNewOrderAlert.tsx
// React Email template: admin new-order alert.
//
// Fires when a Paystack charge.success webhook marks an order as paid.
// Contains full order details so the admin can action without logging in.
//
// Data contract:
//  - order:  Order (from src/types/index.ts)
//  - items:  OrderItem[]

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
} from "@react-email/components";
import * as React from "react";

import type { Order, OrderItem } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNgn(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(kobo / 100);
}

function formatDatetime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-NG", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const main: React.CSSProperties = {
  backgroundColor: "#f5f5f5",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const container: React.CSSProperties = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "600px",
};

const headerSection: React.CSSProperties = {
  backgroundColor: "#1a1a2e",
  borderRadius: "8px 8px 0 0",
  padding: "24px 40px",
};

const adminLabel: React.CSSProperties = {
  color: "#f5c5a0",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  margin: "0 0 4px",
};

const brandInHeader: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0",
};

const alertBadge: React.CSSProperties = {
  backgroundColor: "#16a34a",
  borderRadius: "4px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.06em",
  padding: "4px 10px",
  textTransform: "uppercase" as const,
  margin: "8px 0 0",
};

const contentSection: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "0 0 8px 8px",
  padding: "32px 40px",
  border: "1px solid #e0e0e0",
  borderTop: "none",
};

const h1: React.CSSProperties = {
  color: "#1a1a1a",
  fontSize: "20px",
  fontWeight: "600",
  margin: "0 0 4px",
};

const paragraph: React.CSSProperties = {
  color: "#555",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 20px",
};

const sectionHeading: React.CSSProperties = {
  color: "#1a1a1a",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  margin: "0 0 10px",
  paddingBottom: "6px",
  borderBottom: "2px solid #1a1a2e",
};

const infoLabel: React.CSSProperties = {
  color: "#888",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.05em",
  textTransform: "uppercase" as const,
  margin: "0 0 2px",
};

const infoValue: React.CSSProperties = {
  color: "#1a1a1a",
  fontSize: "14px",
  margin: "0 0 14px",
};

const refValue: React.CSSProperties = {
  color: "#c8501a",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0 0 14px",
};

const itemRow: React.CSSProperties = {
  paddingBottom: "8px",
  marginBottom: "8px",
  borderBottom: "1px solid #f0f0f0",
};

const itemName: React.CSSProperties = {
  color: "#1a1a1a",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 2px",
};

const itemMeta: React.CSSProperties = {
  color: "#666",
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
  paddingTop: "10px",
};

const totalLabel: React.CSSProperties = {
  color: "#1a1a1a",
  fontSize: "15px",
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

const footer: React.CSSProperties = {
  color: "#aaa",
  fontSize: "11px",
  textAlign: "center" as const,
  margin: "28px 0 0",
};

// ─── Component ───────────────────────────────────────────────────────────────

export interface AdminNewOrderAlertProps {
  order: Order;
  items: OrderItem[];
}

export function AdminNewOrderAlert({ order, items }: AdminNewOrderAlertProps) {
  return (
    <Html>
      <Head />
      <Preview>
        New order {order.reference} — {order.customer_name} — {formatNgn(order.total_ngn)}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={adminLabel}>Admin Alert</Text>
            <Text style={brandInHeader}>Rodo &amp; Co</Text>
            <Text style={alertBadge}>New Order Received</Text>
          </Section>

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={h1}>New Paid Order</Heading>
            <Text style={paragraph}>
              A payment has been confirmed via Paystack. Order details are below.
            </Text>

            {/* Reference + timestamp */}
            <Text style={sectionHeading}>Order Summary</Text>
            <Text style={infoLabel}>Reference</Text>
            <Text style={refValue}>{order.reference}</Text>

            <Text style={infoLabel}>Placed</Text>
            <Text style={infoValue}>{formatDatetime(order.created_at)}</Text>

            <Text style={infoLabel}>Week Of</Text>
            <Text style={infoValue}>{order.week_of}</Text>

            <Hr style={{ borderColor: "#e0e0e0", margin: "8px 0 20px" }} />

            {/* Customer details */}
            <Text style={sectionHeading}>Customer</Text>
            <Text style={infoLabel}>Name</Text>
            <Text style={infoValue}>{order.customer_name}</Text>

            <Text style={infoLabel}>Email</Text>
            <Text style={infoValue}>
              <a href={`mailto:${order.customer_email}`} style={{ color: "#1a1a2e" }}>
                {order.customer_email}
              </a>
            </Text>

            <Text style={infoLabel}>Phone</Text>
            <Text style={infoValue}>{order.customer_phone}</Text>

            <Text style={infoLabel}>Delivery Address</Text>
            <Text style={infoValue}>{order.delivery_address}</Text>

            {order.allergy_notes && (
              <>
                <Text style={infoLabel}>Allergy / Notes</Text>
                <Text style={{ ...infoValue, color: "#c8501a", fontWeight: "600" }}>
                  {order.allergy_notes}
                </Text>
              </>
            )}

            <Hr style={{ borderColor: "#e0e0e0", margin: "8px 0 20px" }} />

            {/* Order items with prep instructions */}
            <Text style={sectionHeading}>Items &amp; Prep Instructions</Text>
            {items.map((item) => (
              <Row key={item.id} style={itemRow}>
                <Column>
                  <Text style={itemName}>
                    {item.quantity} × {item.product_name}
                  </Text>
                  <Text style={itemMeta}>
                    {[item.variant_label, item.prep_option].filter(Boolean).join(" · ") || "Standard — no prep option"}
                  </Text>
                </Column>
                <Column>
                  <Text style={itemPrice}>{formatNgn(item.subtotal_ngn)}</Text>
                </Column>
              </Row>
            ))}

            <Hr style={{ borderColor: "#1a1a2e", margin: "0 0 10px" }} />
            <Row style={totalRow}>
              <Column>
                <Text style={totalLabel}>Total Received</Text>
              </Column>
              <Column>
                <Text style={totalValue}>{formatNgn(order.total_ngn)}</Text>
              </Column>
            </Row>
          </Section>

          {/* Footer */}
          <Text style={footer}>
            Rodo &amp; Co Admin Notification · This email was auto-generated on order payment.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default AdminNewOrderAlert;
