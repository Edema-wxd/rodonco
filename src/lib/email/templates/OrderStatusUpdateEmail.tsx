// src/lib/email/templates/OrderStatusUpdateEmail.tsx
// Customer-facing notification sent when an admin moves an order to a new
// status. Structure and styles mirror DeliveryReminderEmail, including the
// shared ctaWrap/ctaButton "track your order" pattern.

import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";
import * as React from "react";

/**
 * The only statuses that produce a customer email. "paid" is already covered
 * by the order receipt and "pending" is a pre-payment internal state, so
 * neither is notifiable — see shouldNotifyStatusChange().
 */
export type NotifiableOrderStatus = "processing" | "delivered" | "cancelled";

interface StatusCopy {
  subject: (reference: string) => string;
  preview: string;
  heading: string;
  body: string;
  callout: string;
  tone: "positive" | "neutral";
}

export const STATUS_COPY: Record<NotifiableOrderStatus, StatusCopy> = {
  processing: {
    subject: (reference) => `We're preparing your order ${reference}`,
    preview: "Good news — your Rodo & Co order is being prepared",
    heading: "Your order is being prepared",
    body:
      "our team has started putting your order together. We'll pack everything fresh and " +
      "have it ready for your Saturday delivery.",
    callout: "Status: Being prepared",
    tone: "positive",
  },
  delivered: {
    subject: (reference) => `Your order ${reference} has been delivered`,
    preview: "Your Rodo & Co order has been delivered",
    heading: "Your order has been delivered",
    body:
      "your order is with you — enjoy! If anything isn't quite right, reply to this email " +
      "and we'll sort it out straight away.",
    callout: "Status: Delivered",
    tone: "positive",
  },
  cancelled: {
    subject: (reference) => `Your order ${reference} has been cancelled`,
    preview: "Your Rodo & Co order has been cancelled",
    heading: "Your order has been cancelled",
    body:
      "this order has been cancelled and will not be delivered. If you paid for it, your " +
      "refund is on its way. Reply to this email if you have any questions.",
    callout: "Status: Cancelled",
    tone: "neutral",
  },
};

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

const referenceLine: React.CSSProperties = {
  color: "#777",
  fontSize: "13px",
  margin: "0 0 20px",
};

const positiveCallout: React.CSSProperties = {
  backgroundColor: "#f0faf0",
  border: "1px solid #b8ddb8",
  borderRadius: "6px",
  padding: "14px 16px",
  margin: "0 0 24px",
};

const positiveCalloutText: React.CSSProperties = {
  color: "#1a6e1a",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
};

const neutralCallout: React.CSSProperties = {
  backgroundColor: "#faf6f2",
  border: "1px solid #e0d2c4",
  borderRadius: "6px",
  padding: "14px 16px",
  margin: "0 0 24px",
};

const neutralCalloutText: React.CSSProperties = {
  color: "#8a5a34",
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

export interface OrderStatusUpdateEmailProps {
  customerName: string;
  reference: string;
  status: NotifiableOrderStatus;
  /** One-click link back to this order. Omitted when it can't be built. */
  trackUrl?: string | null;
}

export function OrderStatusUpdateEmail({
  customerName,
  reference,
  status,
  trackUrl,
}: OrderStatusUpdateEmailProps) {
  const copy = STATUS_COPY[status];
  const calloutStyle = copy.tone === "positive" ? positiveCallout : neutralCallout;
  const calloutTextStyle = copy.tone === "positive" ? positiveCalloutText : neutralCalloutText;

  return (
    <Html>
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={brandName}>Rodo &amp; Co</Text>
            <Text style={brandTagline}>Fresh ingredients, prepared your way</Text>
          </Section>

          <Section style={contentSection}>
            <Text style={h1}>{copy.heading}</Text>
            <Text style={referenceLine}>Order {reference}</Text>
            <Text style={paragraph}>
              Hi {customerName}, {copy.body}
            </Text>

            <Section style={calloutStyle}>
              <Text style={calloutTextStyle}>{copy.callout}</Text>
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

            <Text style={paragraph}>
              Thank you for ordering with us. If you have any questions, reply to this email and
              we&apos;ll get back to you.
            </Text>
          </Section>

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

export default OrderStatusUpdateEmail;
