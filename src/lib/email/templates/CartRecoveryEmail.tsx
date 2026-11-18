// src/lib/email/templates/CartRecoveryEmail.tsx
// Sent by an admin from the Orders page to a customer whose order is still
// unpaid (status "pending"): reminds them what they picked and links back to
// checkout. Structure and styles mirror OrderStatusUpdateEmail and the receipt.

import {
  Body,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "react-email";
import * as React from "react";

import { firstName } from "@/lib/admin/cartRecovery";
import { formatNgn } from "@/lib/admin/format";

export type CartRecoveryEmailItem = {
  id: string;
  product_name: string;
  variant_label: string | null;
  prep_option: string | null;
  quantity: number;
  subtotal_ngn: number;
};

export interface CartRecoveryEmailProps {
  customerName: string;
  reference: string;
  items: CartRecoveryEmailItem[];
  totalNgn: number;
  checkoutUrl: string;
  /** Store WhatsApp number from Settings, shown as a way to get help. */
  whatsappNumber?: string | null;
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

const referenceLine: React.CSSProperties = {
  color: "#777",
  fontSize: "13px",
  margin: "0 0 20px",
};

const paragraph: React.CSSProperties = {
  color: "#444",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const sectionHeading: React.CSSProperties = {
  color: "#1a1a1a",
  fontSize: "13px",
  fontWeight: "700",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  margin: "8px 0 12px",
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

const ctaWrap: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "28px 0 24px",
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

const footer: React.CSSProperties = {
  color: "#aaa",
  fontSize: "12px",
  lineHeight: "18px",
  textAlign: "center" as const,
  margin: "32px 0 0",
};

export function CartRecoveryEmail({
  customerName,
  reference,
  items,
  totalNgn,
  checkoutUrl,
  whatsappNumber,
}: CartRecoveryEmailProps) {
  const name = firstName(customerName);
  // The order total includes the delivery fee, which isn't an item.
  const itemsTotal = items.reduce((sum, item) => sum + item.subtotal_ngn, 0);
  const deliveryNgn = totalNgn - itemsTotal;

  return (
    <Html>
      <Head />
      <Preview>{`${name}, you didn't get to finish your Rodo & Co order`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={brandName}>Rodo &amp; Co</Text>
            <Text style={brandTagline}>Fresh ingredients, prepared your way</Text>
          </Section>

          <Section style={contentSection}>
            <Text style={h1}>Your order is still waiting</Text>
            <Text style={referenceLine}>Order {reference}</Text>
            <Text style={paragraph}>
              Hi {name}, it looks like you didn&apos;t get to finish checking out. Here&apos;s what
              was in your order:
            </Text>

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

            {deliveryNgn > 0 ? (
              <Row style={itemRow}>
                <Column>
                  <Text style={itemName}>Delivery</Text>
                </Column>
                <Column>
                  <Text style={itemPrice}>{formatNgn(deliveryNgn)}</Text>
                </Column>
              </Row>
            ) : null}

            <Hr style={{ borderColor: "#c8501a", margin: "0 0 12px" }} />
            <Row>
              <Column>
                <Text style={totalLabel}>Order total</Text>
              </Column>
              <Column>
                <Text style={totalValue}>{formatNgn(totalNgn)}</Text>
              </Column>
            </Row>

            <Section style={ctaWrap}>
              <a href={checkoutUrl} style={ctaButton}>
                Complete my order →
              </a>
              <Text style={ctaHint}>
                If your basket has cleared, you can add your items again from the shop.
              </Text>
            </Section>

            <Text style={paragraph}>
              Need a hand or have a question? Just reply to this email
              {whatsappNumber ? ` or message us on WhatsApp at ${whatsappNumber}` : ""} and
              we&apos;ll help you sort it out.
            </Text>
          </Section>

          <Text style={footer}>
            Rodo &amp; Co · Fresh food prep, delivered to you every Saturday
            <br />
            You received this email because you started an order on rodoandco.com
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default CartRecoveryEmail;
