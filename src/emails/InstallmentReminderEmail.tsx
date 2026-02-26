import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface InstallmentReminderEmailProps {
  name: string
  amount: string
  checkoutUrl: string
  dueDate: string
}

export const InstallmentReminderEmail = ({
  name,
  amount,
  checkoutUrl,
  dueDate,
}: InstallmentReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>Rata 2 — Cursul A.D.O. este scadentă</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Text style={headerText}>Perspectiva Evei</Text>
        </Section>

        {/* Main Content */}
        <Section style={content}>
          <Text style={greeting}>Salut {name},</Text>
          <Text style={bodyText}>
            Aceasta este o notificare că rata 2 a cursului A.D.O. este scadentă.
          </Text>

          {/* Payment Details */}
          <Section style={paymentBox}>
            <Text style={paymentTitle}>Detalii plată</Text>
            <Section style={paymentRow}>
              <Text style={paymentLabel}>Valoare:</Text>
              <Text style={paymentValue}>{amount}</Text>
            </Section>
            <Section style={paymentRow}>
              <Text style={paymentLabel}>Scadență:</Text>
              <Text style={paymentValue}>{dueDate}</Text>
            </Section>
          </Section>

          <Text style={warningText}>
            ⚠️ Prețul este în EUR. Echivalentul în RON poate varia în funcție de cursul de schimb.
          </Text>

          <Button style={primaryButton} href={checkoutUrl}>
            Plătește acum
          </Button>

          <Hr style={hr} />

          <Text style={bodyText}>
            Dacă ai deja plătit, te rugăm să ignori acest mesaj. Dacă ai întrebări, contactează-ne.
          </Text>

          <Text style={footer}>
            Contactează-ne: support@perspectivaevei.com
          </Text>
        </Section>

        {/* Footer */}
        <Section style={footerSection}>
          <Text style={footerText}>
            © 2025 Perspectiva Evei. Toate drepturile rezervate.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

const main = {
  backgroundColor: '#f9fafb',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0',
  marginBottom: '64px',
}

const header = {
  backgroundColor: '#2D1B69',
  padding: '32px 20px',
  textAlign: 'center' as const,
}

const headerText = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
}

const content = {
  padding: '40px 20px',
}

const greeting = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#2D1B69',
  marginBottom: '16px',
}

const bodyText = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  marginBottom: '16px',
}

const paymentBox = {
  backgroundColor: '#fef3c7',
  padding: '20px',
  borderRadius: '6px',
  marginBottom: '24px',
  borderLeft: '4px solid #E91E8C',
}

const paymentTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#2D1B69',
  marginBottom: '12px',
}

const paymentRow = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '8px',
}

const paymentLabel = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
}

const paymentValue = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0',
}

const warningText = {
  fontSize: '14px',
  color: '#92400e',
  backgroundColor: '#fef3c7',
  padding: '12px',
  borderRadius: '4px',
  marginBottom: '24px',
  lineHeight: '1.6',
}

const primaryButton = {
  backgroundColor: '#E91E8C',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '12px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  marginBottom: '24px',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
}

const footer = {
  fontSize: '14px',
  color: '#6b7280',
  lineHeight: '1.6',
}

const footerSection = {
  padding: '20px',
  backgroundColor: '#f3f4f6',
  textAlign: 'center' as const,
}

const footerText = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '0',
}
