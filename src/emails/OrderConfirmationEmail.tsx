import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface OrderConfirmationEmailProps {
  name: string
  orderNumber: string
  productName: string
  amount: string
  invoiceUrl?: string
}

export const OrderConfirmationEmail = ({
  name,
  orderNumber,
  productName,
  amount,
  invoiceUrl,
}: OrderConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirmare comandă #{orderNumber}</Preview>
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
            Mulțumim pentru achiziție! Comanda ta a fost confirmată cu succes.
          </Text>

          {/* Order Details */}
          <Section style={orderDetails}>
            <Text style={detailsTitle}>Detalii comandă</Text>
            <Section style={detailsRow}>
              <Text style={detailsLabel}>Număr comandă:</Text>
              <Text style={detailsValue}>{orderNumber}</Text>
            </Section>
            <Section style={detailsRow}>
              <Text style={detailsLabel}>Produs:</Text>
              <Text style={detailsValue}>{productName}</Text>
            </Section>
            <Section style={detailsRow}>
              <Text style={detailsLabel}>Valoare:</Text>
              <Text style={detailsValue}>{amount}</Text>
            </Section>
          </Section>

          <Hr style={hr} />

          <Text style={bodyText}>
            Poți accesa conținutul tău imediat. Dacă ai nevoie de factură, o găsești mai jos.
          </Text>

          {invoiceUrl && (
            <Button style={button} href={invoiceUrl}>
              Descarcă factura
            </Button>
          )}

          <Button
            style={primaryButton}
            href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://perspectivaevei.com'}/curs`}
          >
            Accesează conținutul
          </Button>

          <Hr style={hr} />

          <Text style={footer}>
            Dacă ai întrebări, contactează-ne la support@perspectivaevei.com
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

const orderDetails = {
  backgroundColor: '#f3f4f6',
  padding: '20px',
  borderRadius: '6px',
  marginBottom: '24px',
}

const detailsTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#2D1B69',
  marginBottom: '12px',
}

const detailsRow = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '8px',
}

const detailsLabel = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
}

const detailsValue = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0',
}

const button = {
  backgroundColor: '#f3f4f6',
  borderRadius: '6px',
  color: '#2D1B69',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '10px 24px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  marginRight: '12px',
  marginBottom: '24px',
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
