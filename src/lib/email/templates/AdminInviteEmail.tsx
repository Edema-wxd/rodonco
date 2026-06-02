import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";
import * as React from "react";

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
  backgroundColor: "#c8501a",
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

const passwordBox: React.CSSProperties = {
  backgroundColor: "#f5f5f5",
  border: "1px solid #e0e0e0",
  borderRadius: "6px",
  fontFamily: "monospace",
  fontSize: "18px",
  fontWeight: "700",
  color: "#1a1a2e",
  letterSpacing: "0.08em",
  padding: "12px 16px",
  margin: "0 0 20px",
};

const loginButton: React.CSSProperties = {
  backgroundColor: "#c8501a",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "700",
  padding: "12px 24px",
  textDecoration: "none",
  margin: "0 0 20px",
};

const cautionBox: React.CSSProperties = {
  backgroundColor: "#fffbeb",
  border: "1px solid #fbbf24",
  borderRadius: "6px",
  padding: "12px 16px",
  margin: "0 0 8px",
};

const cautionText: React.CSSProperties = {
  color: "#92400e",
  fontSize: "13px",
  margin: "0",
};

const footer: React.CSSProperties = {
  color: "#aaa",
  fontSize: "11px",
  textAlign: "center" as const,
  margin: "28px 0 0",
};

export interface AdminInviteEmailProps {
  email: string;
  tempPassword: string;
  loginUrl: string;
  invitedBy: string;
}

export function AdminInviteEmail({ email, tempPassword, loginUrl, invitedBy }: AdminInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You've been added to the Rodo &amp; Co admin panel</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={adminLabel}>Admin Access</Text>
            <Text style={brandInHeader}>Rodo &amp; Co</Text>
            <Text style={alertBadge}>You've been invited</Text>
          </Section>

          <Section style={contentSection}>
            <Heading style={h1}>Welcome to the admin panel</Heading>
            <Text style={paragraph}>
              {invitedBy} has granted you access to the Rodo &amp; Co admin dashboard. Use the
              credentials below to log in for the first time.
            </Text>

            <Hr style={{ borderColor: "#e0e0e0", margin: "0 0 20px" }} />

            <Text style={sectionHeading}>Your Login Credentials</Text>

            <Text style={infoLabel}>Email</Text>
            <Text style={infoValue}>{email}</Text>

            <Text style={infoLabel}>Temporary Password</Text>
            <Text style={passwordBox}>{tempPassword}</Text>

            <a href={loginUrl} style={loginButton}>
              Go to Admin Panel →
            </a>

            <Hr style={{ borderColor: "#e0e0e0", margin: "8px 0 20px" }} />

            <div style={cautionBox}>
              <Text style={cautionText}>
                <strong>Keep this password safe.</strong> This email contains your temporary access
                credentials. You can change your password through the admin panel settings once you
                log in.
              </Text>
            </div>
          </Section>

          <Text style={footer}>
            Rodo &amp; Co Admin Invitation · If you did not expect this email, please ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default AdminInviteEmail;
