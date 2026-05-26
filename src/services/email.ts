'use server'

import { Resend } from 'resend'
import { render as renderEmail } from '@react-email/components'
import { WelcomeEmail } from '@/emails/WelcomeEmail'
import { OrderConfirmationEmail } from '@/emails/OrderConfirmationEmail'
import { InstallmentReminderEmail } from '@/emails/InstallmentReminderEmail'
import { InviteEmail } from '@/emails/InviteEmail'
import { PasswordResetEmail } from '@/emails/PasswordResetEmail'
import { SessionBookedEmail } from '@/emails/SessionBookedEmail'
import { SessionReminderEmail } from '@/emails/SessionReminderEmail'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }
const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@perspectivaevei.com'

async function renderToHtml(element: unknown): Promise<string> {
  const result = renderEmail(element as any) as unknown
  if (typeof result === 'string') return result
  // @react-email/render in newer versions returns a Promise
  return await (result as Promise<string>)
}

export async function sendWelcomeEmail(to: string, name: string) {
  const html = await renderToHtml(WelcomeEmail({ name }))
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'Bun venit la Perspectiva Evei!',
    html,
  })
}

export async function sendOrderConfirmationEmail(
  to: string,
  params: {
    name: string
    orderNumber: string
    productName: string
    amount: string
    invoiceUrl?: string
    isFirstInstallment?: boolean
    secondInstallmentDueDate?: string
  }
) {
  const html = await renderToHtml(OrderConfirmationEmail(params))
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Confirmare comandă #${params.orderNumber}`,
    html,
  })
}

export async function sendInstallmentReminderEmail(
  to: string,
  params: {
    name: string
    amount: string
    checkoutUrl: string
    dueDate: string
  }
) {
  const html = await renderToHtml(InstallmentReminderEmail(params))
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'Rata 2 — Cursul A.D.O.! este scadentă',
    html,
  })
}

export async function sendInviteEmail(
  to: string,
  params: {
    name: string
    inviteUrl: string
  }
) {
  const html = await renderToHtml(InviteEmail(params))
  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: 'O nouă platformă Perspectiva Evei — setează-ți parola',
    html,
    text: `Bună ${params.name},\n\nTe invit să îți setezi o nouă parolă pe această platformă folosind link-ul de mai jos:\n\n${params.inviteUrl}\n\nLink-ul expiră în 30 de zile.\n\nCu drag,\nEva`,
  })
  if (error) throw new Error(`Resend error for ${to}: ${error.message}`)
}

export async function sendPasswordResetEmail(
  to: string,
  params: {
    name: string
    resetUrl: string
  }
) {
  const html = await renderToHtml(PasswordResetEmail(params))
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'Resetare parolă — Perspectiva Evei',
    html,
  })
}

export async function sendSessionBookedEmail(
  to: string,
  params: {
    name: string
    sessionDate: string
    sessionTime: string
    zoomLink?: string
  }
) {
  const html = await renderToHtml(SessionBookedEmail(params))
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'Ședință 1:1 confirmată',
    html,
  })
}

export async function sendSessionReminderEmail(
  to: string,
  params: {
    name: string
    sessionDate: string
    sessionTime: string
    zoomLink?: string
  }
) {
  const html = await renderToHtml(SessionReminderEmail(params))
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'Reminder: Ședința ta 1:1 este mâine',
    html,
  })
}

export async function sendCourseExpiryEmail(
  to: string,
  params: { name: string; courseTitle: string }
) {
  const { CourseExpiryEmail } = await import('@/emails/CourseExpiryEmail')
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Accesul tău la ${params.courseTitle} a expirat`,
    react: CourseExpiryEmail(params),
  })
}
