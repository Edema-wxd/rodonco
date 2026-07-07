// src/lib/email/templates/OrderHistoryLink.tsx
// React Email template: "My Orders" magic-link email.
// Sent when a customer requests to view their order history at /orders/my-orders.

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";
import * as React from "react";

// ─── Styles (mirrors CustomerOrderReceipt.tsx for brand consistency) ─────────

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

const buttonWrap: React.CSSProperties = {
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const button: React.CSSProperties = {
  backgroundColor: "#c8501a",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "700",
  padding: "14px 28px",
  textDecoration: "none",
};

const footer: React.CSSProperties = {
  color: "#aaa",
  fontSize: "12px",
  lineHeight: "18px",
  textAlign: "center" as const,
  margin: "32px 0 0",
};

// ─── Component ───────────────────────────────────────────────────────────────

export interface OrderHistoryLinkProps {
  link: string;
  expiresInMinutes: number;
}

export function OrderHistoryLink({ link, expiresInMinutes }: OrderHistoryLinkProps) {
  return (
    <Html>
      <Head />
      <Preview>View your Rodo &amp; Co order history</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={brandName}>Rodo &amp; Co</Text>
            <Text style={brandTagline}>Fresh ingredients, prepared your way</Text>
          </Section>

          <Section style={contentSection}>
            <Heading style={h1}>View your orders</Heading>
            <Text style={paragraph}>
              Click the button below to see your order history and current delivery status.
              This link expires in {expiresInMinutes} minutes and can only be used by you.
            </Text>

            <Section style={buttonWrap}>
              <a href={link} style={button}>
                View My Orders
              </a>
            </Section>

            <Text style={paragraph}>
              If you didn&apos;t request this, you can safely ignore this email.
            </Text>
          </Section>

          <Text style={footer}>
            Rodo &amp; Co · Fresh food prep, delivered to you every Saturday
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
