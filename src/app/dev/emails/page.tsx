'use client'

import { useState } from 'react'
import { WelcomeEmail } from '@/emails/WelcomeEmail'
import { OrderConfirmationEmail } from '@/emails/OrderConfirmationEmail'
import { InstallmentReminderEmail } from '@/emails/InstallmentReminderEmail'
import { PasswordResetEmail } from '@/emails/PasswordResetEmail'
import { SessionBookedEmail } from '@/emails/SessionBookedEmail'
import { SessionReminderEmail } from '@/emails/SessionReminderEmail'


const emailTemplates = [
  {
    name: 'Welcome Email',
    component: <WelcomeEmail name="John Doe" />,
    description: 'Sent when a user registers',
  },
  {
    name: 'Order Confirmation',
    component: (
      <OrderConfirmationEmail
        name="John Doe"
        orderNumber="ORD-001"
        productName="Cursul A.D.O."
        amount="297 EUR"
        invoiceUrl="https://example.com/invoice.pdf"
      />
    ),
    description: 'Sent after a successful purchase',
  },
  {
    name: 'Installment Reminder',
    component: (
      <InstallmentReminderEmail
        name="John Doe"
        amount="148.50 EUR"
        checkoutUrl="https://checkout.example.com/order-123"
        dueDate="2025-03-15"
      />
    ),
    description: 'Sent as reminder for second installment payment',
  },
  {
    name: 'Password Reset',
    component: (
      <PasswordResetEmail
        name="John Doe"
        resetUrl="https://example.com/reset?token=abc123def456"
      />
    ),
    description: 'Sent when user requests password reset',
  },
  {
    name: 'Session Booked',
    component: (
      <SessionBookedEmail
        name="John Doe"
        sessionDate="2025-03-20"
        sessionTime="14:00"
        zoomLink="https://zoom.us/j/123456789"
      />
    ),
    description: 'Sent when 1:1 session is confirmed',
  },
  {
    name: 'Session Reminder',
    component: (
      <SessionReminderEmail
        name="John Doe"
        sessionDate="2025-03-21"
        sessionTime="14:00"
        zoomLink="https://zoom.us/j/123456789"
      />
    ),
    description: 'Sent 24 hours before a scheduled session',
  },
]

export default function EmailPreviewPage() {
  const [selectedTemplate, setSelectedTemplate] = useState(0)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px', color: '#1f2937' }}>
          Email Templates Preview
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px' }}>
          {/* Sidebar */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#51087e' }}>
              Templates
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {emailTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedTemplate(index)}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    backgroundColor: selectedTemplate === index ? '#a007dc' : '#ffffff',
                    color: selectedTemplate === index ? '#ffffff' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: selectedTemplate === index ? 'bold' : 'normal',
                    transition: 'all 0.2s',
                  }}
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#51087e' }}>
                {emailTemplates[selectedTemplate].name}
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                {emailTemplates[selectedTemplate].description}
              </p>

              <div
                style={{
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  padding: '16px',
                  marginBottom: '24px',
                  maxHeight: '600px',
                  overflowY: 'auto',
                  border: '1px solid #e5e7eb',
                }}
              >
                {emailTemplates[selectedTemplate].component}
              </div>

              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                <p>💡 Tip: This is a preview of the email template. In production, this would be sent via Resend.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
