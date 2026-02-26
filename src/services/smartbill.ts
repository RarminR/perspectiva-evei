import type {
  CreateInvoiceParams,
  SmartBillInvoiceResponse,
  SmartBillPdfParams,
} from "@/types/smartbill"

const SMARTBILL_BASE_URL = "https://ws.smartbill.ro/SBORO/api"

class RateLimiter {
  private requests: number[] = []
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests = 25, windowMs = 10000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  async throttle(): Promise<void> {
    const now = Date.now()
    this.requests = this.requests.filter((time) => now - time < this.windowMs)

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0]
      const waitMs = this.windowMs - (now - oldestRequest) + 100
      await new Promise((resolve) => setTimeout(resolve, waitMs))
      return this.throttle()
    }

    this.requests.push(now)
  }
}

class AsyncQueue {
  private pending: Promise<void> = Promise.resolve()

  enqueue<T>(task: () => Promise<T>): Promise<T> {
    const runTask = async (): Promise<T> => task()
    const queued = this.pending.then(runTask, runTask)
    this.pending = queued.then(() => undefined, () => undefined)
    return queued
  }
}

const rateLimiter = new RateLimiter(25, 10000)
const requestQueue = new AsyncQueue()

function getAuthHeader(): string {
  const email = process.env.SMARTBILL_EMAIL
  const token = process.env.SMARTBILL_TOKEN
  if (!email || !token) {
    throw new Error("SmartBill credentials not configured")
  }
  return `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`
}

async function smartbillFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return requestQueue.enqueue(async () => {
    await rateLimiter.throttle()

    const url = `${SMARTBILL_BASE_URL}${path}`
    const headers: Record<string, string> = {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...((options.headers as Record<string, string>) || {}),
    }

    return fetch(url, { ...options, headers })
  })
}

function checkSmartBillError(data: SmartBillInvoiceResponse): void {
  if (data.errorText && data.errorText.trim() !== "") {
    throw new Error(`SmartBill error: ${data.errorText}`)
  }
}

export async function createInvoice(params: CreateInvoiceParams): Promise<SmartBillInvoiceResponse> {
  const products = params.products.map((product) => ({
    ...product,
    isTaxIncluded: true,
    taxPercentage: 21,
    taxName: "TVA",
    measuringUnitName: product.measuringUnitName || "buc",
    currency: product.currency || "EUR",
  }))

  const body = {
    companyVatCode: params.companyVatCode,
    client: {
      ...params.client,
      vatCode: params.client.vatCode || "0000000000000",
      isTaxPayer: params.client.isTaxPayer ?? false,
      country: params.client.country || "Romania",
    },
    issueDate: params.issueDate,
    seriesName: params.seriesName,
    products,
    payment: params.payment,
    isDraft: params.isDraft ?? false,
    useEstimateDetails: params.useEstimateDetails ?? false,
  }

  let response: Response
  try {
    response = await smartbillFetch("/invoice", {
      method: "POST",
      body: JSON.stringify(body),
    })
  } catch (error) {
    throw new Error(`SmartBill network error: ${error}`)
  }

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`SmartBill HTTP ${response.status}: ${text}`)
  }

  const data: SmartBillInvoiceResponse = await response.json()
  checkSmartBillError(data)

  return data
}

export async function getInvoicePdf(params: SmartBillPdfParams): Promise<Buffer> {
  const queryParams = new URLSearchParams({
    cif: params.companyVatCode,
    seriesname: params.seriesName,
    number: params.number,
  })

  const response = await smartbillFetch(`/invoice/pdf?${queryParams.toString()}`, {
    headers: { Accept: "application/octet-stream" },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`SmartBill PDF download failed: ${response.status} ${text}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function stornoInvoice(params: SmartBillPdfParams): Promise<SmartBillInvoiceResponse> {
  const queryParams = new URLSearchParams({
    cif: params.companyVatCode,
    seriesname: params.seriesName,
    number: params.number,
  })

  const response = await smartbillFetch(`/invoice?${queryParams.toString()}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`SmartBill storno failed: ${response.status} ${text}`)
  }

  const data: SmartBillInvoiceResponse = await response.json()
  checkSmartBillError(data)

  return data
}

export async function getInvoiceStatus(
  params: SmartBillPdfParams
): Promise<SmartBillInvoiceResponse> {
  const queryParams = new URLSearchParams({
    cif: params.companyVatCode,
    seriesname: params.seriesName,
    number: params.number,
  })

  const response = await smartbillFetch(`/invoice/status?${queryParams.toString()}`)

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`SmartBill getStatus failed: ${response.status} ${text}`)
  }

  const data: SmartBillInvoiceResponse = await response.json()
  checkSmartBillError(data)

  return data
}
