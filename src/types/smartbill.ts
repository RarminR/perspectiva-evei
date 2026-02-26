export interface SmartBillClient {
  name: string
  vatCode: string
  isTaxPayer: boolean
  address?: string
  city?: string
  county?: string
  country?: string
  email?: string
  phone?: string
}

export interface SmartBillProduct {
  name: string
  code?: string
  description?: string
  measuringUnitName: string
  currency: string
  quantity: number
  price: number
  isTaxIncluded: boolean
  taxPercentage: number
  taxName?: string
}

export interface SmartBillPayment {
  value: number
  type: string
  isCash?: boolean
}

export interface CreateInvoiceParams {
  companyVatCode: string
  client: SmartBillClient
  issueDate: string
  seriesName: string
  products: SmartBillProduct[]
  payment?: SmartBillPayment
  isDraft?: boolean
  useEstimateDetails?: boolean
}

export interface SmartBillInvoiceResponse {
  errorText: string
  message: string
  number: string
  series: string
  url?: string
}

export interface SmartBillPdfParams {
  companyVatCode: string
  seriesName: string
  number: string
}
