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
} from "@react-email/components";

interface ContributionNoticeProps {
  contributorName: string;
  recipientName: string;
  occasionTitle: string;
  giftTitle: string;
  giftPrice: number;
  contributionAmount: number;
  buyerName: string;
  bankDetails: string;
  year: number;
}

export function ContributionNotice({
  contributorName,
  recipientName,
  occasionTitle,
  giftTitle,
  giftPrice,
  contributionAmount,
  buyerName,
  bankDetails,
  year,
}: ContributionNoticeProps) {
  const preview = `Your share for ${recipientName}'s gift is £${contributionAmount.toFixed(2)} — here's where to send it.`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Split Together</Heading>

          <Text style={text}>Hi {contributorName},</Text>

          <Text style={text}>
            The group has purchased {recipientName}&apos;s {year} gift —{" "}
            <strong>{giftTitle}</strong> (£{giftPrice.toFixed(2)}) — and{" "}
            <strong>{buyerName}</strong> fronted the cost.
          </Text>

          <Section style={amountBox}>
            <Text style={amountLabel}>Your contribution</Text>
            <Text style={amountValue}>£{contributionAmount.toFixed(2)}</Text>
          </Section>

          <Text style={text}>
            Please transfer your share to {buyerName}:
          </Text>

          {bankDetails.startsWith("http://") || bankDetails.startsWith("https://") ? (
            <Section style={payLinkBox}>
              <a href={bankDetails} style={payLink}>
                Pay {buyerName} now →
              </a>
            </Section>
          ) : (
            <Section style={bankBox}>
              <Text style={bankText}>{bankDetails}</Text>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            Split Together · {occasionTitle} · {year}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: "#ffffff",
  fontFamily: "'Roboto', Helvetica, Arial, sans-serif",
};

const container: React.CSSProperties = {
  margin: "32px auto",
  maxWidth: "520px",
  padding: "40px 48px",
};

const h1: React.CSSProperties = {
  color: "#111827",
  fontSize: "22px",
  fontWeight: "700",
  marginBottom: "24px",
};

const text: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "1.6",
  marginBottom: "16px",
};

const amountBox: React.CSSProperties = {
  backgroundColor: "#EFF6FF",
  borderRadius: "8px",
  padding: "16px 20px",
  marginBottom: "20px",
};

const amountLabel: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "12px",
  fontWeight: "500",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  margin: "0 0 4px",
};

const amountValue: React.CSSProperties = {
  color: "#3B82F6",
  fontSize: "28px",
  fontWeight: "700",
  margin: "0",
};

const bankBox: React.CSSProperties = {
  backgroundColor: "#F3F4F6",
  borderRadius: "8px",
  padding: "16px 20px",
  marginBottom: "24px",
};

const bankText: React.CSSProperties = {
  color: "#111827",
  fontSize: "14px",
  fontFamily: "monospace",
  whiteSpace: "pre-wrap",
  margin: "0",
};

const hr: React.CSSProperties = {
  borderColor: "#E5E7EB",
  marginBottom: "20px",
};

const footer: React.CSSProperties = {
  color: "#9CA3AF",
  fontSize: "12px",
  margin: "0",
};

const payLinkBox: React.CSSProperties = {
  marginBottom: "24px",
};

const payLink: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#3B82F6",
  color: "#ffffff",
  borderRadius: "8px",
  padding: "12px 20px",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
};
