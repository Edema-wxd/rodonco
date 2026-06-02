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

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

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

export interface DeliveryReminderEmailProps {
  customerName: string;
  weekOf: string; // ISO YYYY-MM-DD (Saturday)
}

export function DeliveryReminderEmail({ customerName, weekOf }: DeliveryReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Rodo &amp; Co delivery is this Saturday — {formatDate(weekOf)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={brandName}>Rodo &amp; Co</Text>
            <Text style={brandTagline}>Fresh ingredients, prepared your way</Text>
          </Section>

          <Section style={contentSection}>
            <Text style={h1}>Your delivery is coming this Saturday!</Text>
            <Text style={paragraph}>
              Hi {customerName}, just a reminder that your Rodo &amp; Co order is scheduled for
              delivery this Saturday. We&apos;re preparing everything fresh for you!
            </Text>

            <Section style={deliveryCallout}>
              <Text style={deliveryText}>Delivery date: {formatDate(weekOf)}</Text>
            </Section>

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

export default DeliveryReminderEmail;
