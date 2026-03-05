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

interface CourseExpiryEmailProps {
  name: string
  courseTitle: string
}

export const CourseExpiryEmail = ({
  name,
  courseTitle,
}: CourseExpiryEmailProps) => (
  <Html>
    <Head />
    <Preview>Accesul tău la {courseTitle} a expirat</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={headerText}>Perspectiva Evei</Text>
        </Section>

        <Section style={content}>
          <Text style={greeting}>Salut {name},</Text>
          <Text style={bodyText}>
            Accesul tău la <strong>{courseTitle}</strong> a expirat.
          </Text>
          <Text style={bodyText}>
            Poți prelungi accesul pentru încă 30 de zile apăsând butonul de mai jos.
          </Text>

          <Button style={primaryButton} href="https://perspectivaevei.com/cursul-ado">
            Prelungește accesul
          </Button>

          <Hr style={hr} />

          <Text style={footer}>
            Dacă ai întrebări, contactează-ne: support@perspectivaevei.com
          </Text>
        </Section>

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
  backgroundColor: '#51087e',
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
  color: '#51087e',
  marginBottom: '16px',
}

const bodyText = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  marginBottom: '16px',
}

const primaryButton = {
  backgroundColor: '#a007dc',
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
