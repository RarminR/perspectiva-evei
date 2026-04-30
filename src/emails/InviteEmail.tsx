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

interface InviteEmailProps {
  name: string
  inviteUrl: string
}

export const InviteEmail = ({ name, inviteUrl }: InviteEmailProps) => (
  <Html>
    <Head />
    <Preview>Setează-ți parola pe noua platformă Perspectiva Evei</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={headerText}>Perspectiva Evei</Text>
        </Section>

        <Section style={content}>
          <Text style={greeting}>Bună {name},</Text>

          <Text style={bodyText}>
            Am plăcerea să te anunț că, exact așa cum te îndrum și pe tine să îți alegi
            identitatea dorită, așa am ales și eu o nouă identitate pentru platforma
            Perspectiva Evei — mai ușor de navigat, mai sigură și mai confortabilă pentru tine.
          </Text>

          <Text style={bodyText}>
            Te invit să îți setezi o nouă parolă pe această platformă folosind link-ul de mai jos:
          </Text>

          <Button style={primaryButton} href={inviteUrl}>
            Setează parola
          </Button>

          <Text style={bodyText}>
            Mă bucur că ești aici și… stai pe aproape! Ți-am pregătit o lansare nouă!
          </Text>

          <Text style={signatureLine}>Cu drag,</Text>
          <Text style={signatureName}>Eva</Text>

          <Hr style={hr} />

          <Text style={bodyText}>
            Dacă butonul nu funcționează, copiază și lipește acest link în browser:
          </Text>
          <Text style={linkText}>{inviteUrl}</Text>

          <Text style={footer}>
            Link-ul expiră în 30 de zile. Dacă ai întrebări, scrie-ne la
            support@perspectivaevei.com.
          </Text>
        </Section>

        <Section style={footerSection}>
          <Text style={footerText}>
            © 2026 Perspectiva Evei. Toate drepturile rezervate.
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

const signatureLine = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  marginTop: '24px',
  marginBottom: '0px',
  fontStyle: 'italic' as const,
}

const signatureName = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  marginTop: '0px',
  marginBottom: '16px',
  fontStyle: 'italic' as const,
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
