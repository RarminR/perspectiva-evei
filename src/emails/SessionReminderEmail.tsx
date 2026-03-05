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

interface SessionReminderEmailProps {
  name: string
  sessionDate: string
  sessionTime: string
  zoomLink?: string
}

export const SessionReminderEmail = ({
  name,
  sessionDate,
  sessionTime,
  zoomLink,
}: SessionReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>Reminder: Ședința ta 1:1 este mâine</Preview>
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
            Aceasta este o notificare că ședința ta 1:1 cu Eva este programată pentru mâine!
          </Text>

          {/* Session Details */}
          <Section style={sessionBox}>
            <Text style={sessionTitle}>📅 Ședința ta</Text>
            <Section style={detailsRow}>
              <Text style={detailsLabel}>Data:</Text>
              <Text style={detailsValue}>{sessionDate}</Text>
            </Section>
            <Section style={detailsRow}>
              <Text style={detailsLabel}>Ora:</Text>
              <Text style={detailsValue}>{sessionTime}</Text>
            </Section>
          </Section>

          {zoomLink && (
            <>
              <Text style={bodyText}>
                Apasă butonul de mai jos pentru a accesa ședința:
              </Text>
              <Button style={primaryButton} href={zoomLink}>
                Intră pe Zoom
              </Button>
            </>
          )}

          {/* Preparation Tips */}
          <Section style={tipsBox}>
            <Text style={tipsTitle}>💡 Sfaturi pentru ședință</Text>
            <Text style={tipText}>
              • Asigură-te că ai o conexiune stabilă la internet
            </Text>
            <Text style={tipText}>
              • Alege un loc liniștit și confortabil
            </Text>
            <Text style={tipText}>
              • Conectează-te 5 minute înainte de ora programată
            </Text>
            <Text style={tipText}>
              • Pregătește-ți întrebările sau subiectele pe care vrei să le discuți
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={bodyText}>
            Așteptăm cu nerăbdare să lucrăm cu tine mâine!
          </Text>

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

const sessionBox = {
  backgroundColor: '#f0fdf4',
  padding: '20px',
  borderRadius: '6px',
  marginBottom: '24px',
  borderLeft: '4px solid #a007dc',
}

const sessionTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#51087e',
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

const tipsBox = {
  backgroundColor: '#dbeafe',
  padding: '20px',
  borderRadius: '6px',
  marginBottom: '24px',
  borderLeft: '4px solid #51087e',
}

const tipsTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#51087e',
  marginBottom: '12px',
}

const tipText = {
  fontSize: '14px',
  color: '#1e40af',
  margin: '8px 0',
  lineHeight: '1.6',
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
