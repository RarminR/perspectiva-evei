import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"

import {
  createInvoice,
  getInvoicePdf,
} from "@/services/smartbill"

type MockJsonValue = Record<string, unknown>

function createJsonResponse(
  payload: MockJsonValue,
  init: { status?: number } = {}
): Response {
  const status = init.status ?? 200
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
    text: vi.fn().mockResolvedValue(JSON.stringify(payload)),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
  } as unknown as Response
}

describe("SmartBill service", () => {
  const originalEnv = { ...process.env }
  const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    process.env.SMARTBILL_EMAIL = "billing@example.com"
    process.env.SMARTBILL_TOKEN = "test-token"
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    process.env = { ...originalEnv }
  })

  it("createInvoice sends isTaxIncluded true and taxPercentage 21", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        errorText: "",
        message: "ok",
        number: "1",
        series: "PF",
      })
    )

    await createInvoice({
      companyVatCode: "RO123",
      issueDate: "2026-01-10",
      seriesName: "PF",
      client: {
        name: "John Doe",
        vatCode: "0000000000000",
        isTaxPayer: false,
      },
      products: [
        {
          name: "Session",
          measuringUnitName: "",
          currency: "",
          quantity: 1,
          price: 100,
          isTaxIncluded: false,
          taxPercentage: 0,
        },
      ],
    })

    const call = fetchMock.mock.calls[0]
    const body = JSON.parse((call[1]?.body as string) ?? "{}")
    expect(body.products[0].isTaxIncluded).toBe(true)
    expect(body.products[0].taxPercentage).toBe(21)
    expect(body.products[0].taxName).toBe("TVA")
  })

  it("createInvoice uses B2C vatCode when client vatCode not provided", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        errorText: "",
        message: "ok",
        number: "2",
        series: "PF",
      })
    )

    await createInvoice({
      companyVatCode: "RO123",
      issueDate: "2026-01-10",
      seriesName: "PF",
      client: {
        name: "Anonymous",
        vatCode: "",
        isTaxPayer: false,
      },
      products: [
        {
          name: "Guide",
          measuringUnitName: "buc",
          currency: "EUR",
          quantity: 1,
          price: 47,
          isTaxIncluded: true,
          taxPercentage: 21,
        },
      ],
    })

    const call = fetchMock.mock.calls[0]
    const body = JSON.parse((call[1]?.body as string) ?? "{}")
    expect(body.client.vatCode).toBe("0000000000000")
  })

  it("createInvoice throws on HTTP 200 when errorText is present", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        errorText: "Seria nu exista",
        message: "",
        number: "",
        series: "",
      })
    )

    await expect(
      createInvoice({
        companyVatCode: "RO123",
        issueDate: "2026-01-10",
        seriesName: "PF",
        client: {
          name: "John Doe",
          vatCode: "0000000000000",
          isTaxPayer: false,
        },
        products: [
          {
            name: "Session",
            measuringUnitName: "buc",
            currency: "EUR",
            quantity: 1,
            price: 100,
            isTaxIncluded: true,
            taxPercentage: 21,
          },
        ],
      })
    ).rejects.toThrow("SmartBill error: Seria nu exista")
  })

  it("createInvoice throws on HTTP 500", async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ detail: "malformed" }, { status: 500 }))

    await expect(
      createInvoice({
        companyVatCode: "RO123",
        issueDate: "2026-01-10",
        seriesName: "PF",
        client: {
          name: "John Doe",
          vatCode: "0000000000000",
          isTaxPayer: false,
        },
        products: [
          {
            name: "Session",
            measuringUnitName: "buc",
            currency: "EUR",
            quantity: 1,
            price: 100,
            isTaxIncluded: true,
            taxPercentage: 21,
          },
        ],
      })
    ).rejects.toThrow("SmartBill HTTP 500")
  })

  it("rate limiter throttles requests after 25 requests in 10 seconds", async () => {
    vi.useRealTimers()
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        createJsonResponse({
          errorText: "",
          message: "ok",
          number: "1",
          series: "PF",
        })
      )
    )

    const basePayload = {
      companyVatCode: "RO123",
      issueDate: "2026-01-10",
      seriesName: "PF",
      client: {
        name: "John Doe",
        vatCode: "0000000000000",
        isTaxPayer: false,
      },
      products: [
        {
          name: "Session",
          measuringUnitName: "buc",
          currency: "EUR",
          quantity: 1,
          price: 100,
          isTaxIncluded: true,
          taxPercentage: 21,
        },
      ],
    }

    const setTimeoutSpy = vi
      .spyOn(global, "setTimeout")
      .mockImplementation(((handler: TimerHandler) => {
        if (typeof handler === "function") {
          handler()
        }

        return 0 as unknown as ReturnType<typeof setTimeout>
      }) as typeof setTimeout)

    const calls = Array.from({ length: 26 }, () => createInvoice(basePayload))
    await Promise.all(calls)

    expect(fetchMock).toHaveBeenCalledTimes(26)
    expect(
      setTimeoutSpy.mock.calls.some(([, delay]) => typeof delay === "number" && delay >= 10000)
    ).toBe(true)

    setTimeoutSpy.mockRestore()
    vi.useFakeTimers()
  })

  it("getInvoicePdf returns Buffer on success", async () => {
    const payload = Uint8Array.from([1, 2, 3, 4])
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      arrayBuffer: vi.fn().mockResolvedValue(payload.buffer),
      text: vi.fn().mockResolvedValue(""),
      json: vi.fn(),
    } as unknown as Response)

    const result = await getInvoicePdf({
      companyVatCode: "RO123",
      seriesName: "PF",
      number: "12",
    })

    expect(Buffer.isBuffer(result)).toBe(true)
    expect([...result]).toEqual([1, 2, 3, 4])
  })
})
