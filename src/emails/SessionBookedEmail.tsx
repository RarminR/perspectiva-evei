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

interface SessionBookedEmailProps {
  name: string
  sessionDate: string
  sessionTime: string
  zoomLink?: string
}

export const SessionBookedEmail = ({
  name,
  sessionDate,
  sessionTime,
  zoomLink,
}: SessionBookedEmailProps) => (
  <Html>
    <Head />
    <Preview>Ședință 1:1 confirmată</Preview>
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
            Ședința ta 1:1 cu Eva a fost confirmată! Suntem entuziaști să lucrăm cu tine.
          </Text>

          {/* Session Details */}
          <Section style={sessionBox}>
            <Text style={sessionTitle}>📅 Detalii ședință</Text>
            <Section style={detailsRow}>
              <Text style={detailsLabel}>Data:</Text>
              <Text style={detailsValue}>{sessionDate}</Text>
            </Section>
            <Section style={detailsRow}>
              <Text style={detailsLabel}>Ora:</Text>
              <Text style={detailsValue}>{sessionTime}</Text>
            </Section>
            {zoomLink && (
              <Section style={detailsRow}>
                <Text style={detailsLabel}>Format:</Text>
                <Text style={detailsValue}>Online (Zoom)</Text>
              </Section>
            )}
          </Section>

          {zoomLink && (
            <>
              <Button style={primaryButton} href={zoomLink}>
                Intră pe Zoom
              </Button>
              <Text style={zoomNote}>
                Link-ul Zoom va fi disponibil 15 minute înainte de ședință.
              </Text>
            </>
          )}

          {/* Important Notes */}
          <Section style={notesBox}>
            <Text style={notesTitle}>⚠️ Informații importante</Text>
            <Text style={noteText}>
              • Dacă trebuie să anulezi, contactează-ne cu cel puțin 24 de ore înainte
            </Text>
            <Text style={noteText}>
              • Asigură-te că ai o conexiune stabilă la internet
            </Text>
            <Text style={noteText}>
              • Alege un loc liniștit pentru ședință
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={bodyText}>
            Dacă ai întrebări înainte de ședință, nu ezita să ne contactezi.
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
  marginBottom: '12px',
}

const zoomNote = {
  fontSize: '13px',
  color: '#6b7280',
  fontStyle: 'italic',
  marginBottom: '24px',
}

const notesBox = {
  backgroundColor: '#fef3c7',
  padding: '20px',
  borderRadius: '6px',
  marginBottom: '24px',
  borderLeft: '4px solid #a007dc',
}

const notesTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#51087e',
  marginBottom: '12px',
}

const noteText = {
  fontSize: '14px',
  color: '#92400e',
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
