'use server'

import { Resend } from 'resend'
import { WelcomeEmail } from '@/emails/WelcomeEmail'
import { OrderConfirmationEmail } from '@/emails/OrderConfirmationEmail'
import { InstallmentReminderEmail } from '@/emails/InstallmentReminderEmail'
import { InviteEmail } from '@/emails/InviteEmail'
import { PasswordResetEmail } from '@/emails/PasswordResetEmail'
import { SessionBookedEmail } from '@/emails/SessionBookedEmail'
import { SessionReminderEmail } from '@/emails/SessionReminderEmail'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }
const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@perspectivaevei.com'

export async function sendWelcomeEmail(to: string, name: string) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'Bun venit la Perspectiva Evei!',
    react: WelcomeEmail({ name }),
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
  }
) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Confirmare comandă #${params.orderNumber}`,
    react: OrderConfirmationEmail(params),
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
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'Rata 2 — Cursul A.D.O. este scadentă',
    react: InstallmentReminderEmail(params),
  })
}

export async function sendInviteEmail(
  to: string,
  params: {
    name: string
    inviteUrl: string
  }
) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'O nouă platformă Perspectiva Evei — setează-ți parola',
    react: InviteEmail(params),
  })
}

export async function sendPasswordResetEmail(
  to: string,
  params: {
    name: string
    resetUrl: string
  }
) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'Resetare parolă — Perspectiva Evei',
    react: PasswordResetEmail(params),
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
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'Ședință 1:1 confirmată',
    react: SessionBookedEmail(params),
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
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'Reminder: Ședința ta 1:1 este mâine',
    react: SessionReminderEmail(params),
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
