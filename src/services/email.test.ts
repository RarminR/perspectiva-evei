import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendInstallmentReminderEmail,
  sendPasswordResetEmail,
  sendSessionBookedEmail,
  sendSessionReminderEmail,
} from './email'

// Mock Resend
vi.mock('resend', () => {
  const mockSend = vi.fn().mockResolvedValue({ id: 'test-email-id' })
  return {
    Resend: vi.fn(() => ({
      emails: {
        send: mockSend,
      },
    })),
  }
})

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendWelcomeEmail', () => {
    it('sends welcome email with correct subject', async () => {
      const result = await sendWelcomeEmail('test@example.com', 'John Doe')
      expect(result).toHaveProperty('id')
    })

    it('includes recipient email in send call', async () => {
      const { Resend } = await import('resend')
      const mockResend = new Resend()
      await sendWelcomeEmail('john@example.com', 'John')
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
        })
      )
    })

    it('includes correct subject line', async () => {
      const { Resend } = await import('resend')
      const mockResend = new Resend()
      await sendWelcomeEmail('test@example.com', 'Test')
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Bun venit la Perspectiva Evei!',
        })
      )
    })
  })

  describe('sendOrderConfirmationEmail', () => {
    it('sends order confirmation with order number in subject', async () => {
      const { Resend } = await import('resend')
      const mockResend = new Resend()
      await sendOrderConfirmationEmail('test@example.com', {
        name: 'John',
        orderNumber: 'ORD-001',
        productName: 'Cursul A.D.O.',
        amount: '297 EUR',
      })
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('ORD-001'),
        })
      )
    })

    it('includes invoice URL when provided', async () => {
      const { Resend } = await import('resend')
      const mockResend = new Resend()
      await sendOrderConfirmationEmail('test@example.com', {
        name: 'John',
        orderNumber: 'ORD-002',
        productName: 'Ghid',
        amount: '47 EUR',
        invoiceUrl: 'https://example.com/invoice.pdf',
      })
      expect(mockResend.emails.send).toHaveBeenCalled()
    })
  })

  describe('sendInstallmentReminderEmail', () => {
    it('sends installment reminder with checkout URL', async () => {
      const { Resend } = await import('resend')
      const mockResend = new Resend()
      const checkoutUrl = 'https://checkout.example.com/order-123'
      await sendInstallmentReminderEmail('test@example.com', {
        name: 'John',
        amount: '148.50 EUR',
        checkoutUrl,
        dueDate: '2025-03-15',
      })
      expect(mockResend.emails.send).toHaveBeenCalled()
    })

    it('includes correct subject for installment reminder', async () => {
      const { Resend } = await import('resend')
      const mockResend = new Resend()
      await sendInstallmentReminderEmail('test@example.com', {
        name: 'John',
        amount: '148.50 EUR',
        checkoutUrl: 'https://checkout.example.com',
        dueDate: '2025-03-15',
      })
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Rata 2'),
        })
      )
    })
  })

  describe('sendPasswordResetEmail', () => {
    it('sends password reset email with reset URL', async () => {
      const { Resend } = await import('resend')
      const mockResend = new Resend()
      const resetUrl = 'https://example.com/reset?token=abc123'
      await sendPasswordResetEmail('test@example.com', {
        name: 'John',
        resetUrl,
      })
      expect(mockResend.emails.send).toHaveBeenCalled()
    })

    it('includes correct subject for password reset', async () => {
      const { Resend } = await import('resend')
      const mockResend = new Resend()
      await sendPasswordResetEmail('test@example.com', {
        name: 'John',
        resetUrl: 'https://example.com/reset',
      })
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Resetare parolă'),
        })
      )
    })
  })

  describe('sendSessionBookedEmail', () => {
    it('sends session booked confirmation', async () => {
      const { Resend } = await import('resend')
      const mockResend = new Resend()
      await sendSessionBookedEmail('test@example.com', {
        name: 'John',
        sessionDate: '2025-03-20',
        sessionTime: '14:00',
        zoomLink: 'https://zoom.us/j/123456',
      })
      expect(mockResend.emails.send).toHaveBeenCalled()
    })

    it('includes correct subject for session booking', async () => {
      const { Resend } = await import('resend')
      const mockResend = new Resend()
      await sendSessionBookedEmail('test@example.com', {
        name: 'John',
        sessionDate: '2025-03-20',
        sessionTime: '14:00',
      })
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Ședință 1:1 confirmată'),
        })
      )
    })
  })

  describe('sendSessionReminderEmail', () => {
    it('sends session reminder email', async () => {
      const { Resend } = await import('resend')
      const mockResend = new Resend()
      await sendSessionReminderEmail('test@example.com', {
        name: 'John',
        sessionDate: '2025-03-21',
        sessionTime: '14:00',
        zoomLink: 'https://zoom.us/j/123456',
      })
      expect(mockResend.emails.send).toHaveBeenCalled()
    })

    it('includes correct subject for session reminder', async () => {
      const { Resend } = await import('resend')
      const mockResend = new Resend()
      await sendSessionReminderEmail('test@example.com', {
        name: 'John',
        sessionDate: '2025-03-21',
        sessionTime: '14:00',
      })
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Reminder'),
        })
      )
    })
  })

  describe('Email service integration', () => {
    it('all send functions return response with id', async () => {
      const result1 = await sendWelcomeEmail('test@example.com', 'John')
      const result2 = await sendOrderConfirmationEmail('test@example.com', {
        name: 'John',
        orderNumber: 'ORD-001',
        productName: 'Course',
        amount: '297 EUR',
      })
      const result3 = await sendPasswordResetEmail('test@example.com', {
        name: 'John',
        resetUrl: 'https://example.com/reset',
      })

      expect(result1).toHaveProperty('id')
      expect(result2).toHaveProperty('id')
      expect(result3).toHaveProperty('id')
    })
  })
})
