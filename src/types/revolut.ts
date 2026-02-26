export type RevolutEnvironment = 'sandbox' | 'production'

export type RevolutOrderStatus = 'PENDING' | 'AUTHORISED' | 'COMPLETED' | 'CANCELLED' | 'FAILED'

export interface RevolutOrder {
  id: string
  token: string
  type: string
  state: RevolutOrderStatus
  created_date: string
  updated_date: string
  completed_date?: string
  checkout_url?: string
  amount: number
  currency: string
  outstanding_amount?: number
  capture_mode?: string
  merchant_order_data?: {
    reference?: string
    url?: string
  }
  customer?: {
    id?: string
    email?: string
    name?: string
  }
  payments?: RevolutPayment[]
}

export interface RevolutPayment {
  id: string
  state: string
  created_date: string
  updated_date: string
  amount: number
  currency: string
  payment_method?: {
    type: string
    card?: {
      brand: string
      last4: string
    }
  }
}

export interface CreateOrderParams {
  amount: number
  currency: string
  customerEmail?: string
  customerName?: string
  description?: string
  redirectUrl?: string
  merchantOrderReference?: string
  expirePendingAfter?: string
}

export interface RefundParams {
  amount?: number
  description?: string
}

export interface RevolutWebhookEvent {
  event: string
  timestamp: string
  order_id: string
  merchant_order_ext_ref?: string
}
