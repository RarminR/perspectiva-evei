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

interface PasswordResetEmailProps {
  name: string
  resetUrl: string
}

export const PasswordResetEmail = ({
  name,
  resetUrl,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Resetare parolă — Perspectiva Evei</Preview>
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
            Ai solicitat resetarea parolei pentru contul tău. Dacă nu ai făcut această cerere, poți ignora acest email.
          </Text>

          <Text style={bodyText}>
            Apasă butonul de mai jos pentru a reseta parola:
          </Text>

          <Button style={primaryButton} href={resetUrl}>
            Resetează parola
          </Button>

          {/* Security Note */}
          <Section style={securityBox}>
            <Text style={securityTitle}>🔒 Informații de securitate</Text>
            <Text style={securityText}>
              • Link-ul expiră în 24 de ore
            </Text>
            <Text style={securityText}>
              • Dacă nu ai solicitat resetarea, contactează-ne imediat
            </Text>
            <Text style={securityText}>
              • Nu partaja acest link cu nimeni
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={bodyText}>
            Dacă butonul nu funcționează, copiază și lipește acest link în browser:
          </Text>
          <Text style={linkText}>{resetUrl}</Text>

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

const securityBox = {
  backgroundColor: '#dbeafe',
  padding: '20px',
  borderRadius: '6px',
  marginBottom: '24px',
  borderLeft: '4px solid #2D1B69',
}

const securityTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#2D1B69',
  marginBottom: '12px',
}

const securityText = {
  fontSize: '14px',
  color: '#1e40af',
  margin: '8px 0',
  lineHeight: '1.6',
}

const linkText = {
  fontSize: '12px',
  color: '#6b7280',
  wordBreak: 'break-all' as const,
  backgroundColor: '#f3f4f6',
  padding: '12px',
  borderRadius: '4px',
  marginBottom: '16px',
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
