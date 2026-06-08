import axios, { AxiosError } from "axios"
import crypto from "crypto"

const FLUTTERWAVE_TOKEN_URL = "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token"
const FLUTTERWAVE_SANDBOX_BASE_URL = "https://developersandbox-api.flutterwave.com"
const FLUTTERWAVE_PRODUCTION_BASE_URL = "https://f4bexperience.flutterwave.com"

const FLUTTERWAVE_CLIENT_ID = process.env.FLUTTERWAVE_CLIENT_ID
const FLUTTERWAVE_CLIENT_SECRET = process.env.FLUTTERWAVE_CLIENT_SECRET

let tokenCache: { accessToken: string; expiresAt: number } | null = null

type InitializeFlutterwavePaymentParams = {
  email: string
  amount: number
  currency: string
  reference: string
  redirect_url: string
  customerName?: string
  mobileMoney?: {
    countryCode: string
    network: string
    phoneNumber: string
  }
  metadata?: Record<string, any>
}

type FlutterwavePaymentResponse = {
  status: string
  message: string
  data?: {
    id?: string
    link: string
    instruction?: string
  }
}

type FlutterwaveVerifyResponse = {
  status: string
  message: string
  data?: {
    id: string
    tx_ref?: string
    reference?: string
    amount: number
    currency: string
    charged_amount?: number
    status: string
    created_at?: string
    created_datetime?: string
    customer?: {
      email: string
      name?: string
    }
  }
}

function getFlutterwaveErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<any>
  return (
    axiosError.response?.data?.error?.message ||
    axiosError.response?.data?.error?.detail ||
    axiosError.response?.data?.message ||
    fallback
  )
}

function flutterwaveBaseUrl() {
  const environment = (process.env.FLUTTERWAVE_ENVIRONMENT || "sandbox").toLowerCase()
  return environment === "production" || environment === "live"
    ? FLUTTERWAVE_PRODUCTION_BASE_URL
    : FLUTTERWAVE_SANDBOX_BASE_URL
}

function ensureFlutterwaveCredentials() {
  if (!FLUTTERWAVE_CLIENT_ID || !FLUTTERWAVE_CLIENT_SECRET) {
    throw new Error("Flutterwave V4 client credentials are not configured")
  }
}

function splitName(name?: string) {
  const parts = (name || "Vibe2Gether Customer").trim().split(/\s+/)
  const first = parts.shift() || "Vibe2Gether"
  const last = parts.length ? parts.join(" ") : "Customer"
  return { first, last }
}

async function getFlutterwaveAccessToken() {
  ensureFlutterwaveCredentials()

  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.accessToken
  }

  const body = new URLSearchParams({
    client_id: FLUTTERWAVE_CLIENT_ID!,
    client_secret: FLUTTERWAVE_CLIENT_SECRET!,
    grant_type: "client_credentials",
  })

  const response = await axios.post(FLUTTERWAVE_TOKEN_URL, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  })

  const accessToken = response.data?.access_token
  if (!accessToken) throw new Error("Flutterwave did not return an access token")

  tokenCache = {
    accessToken,
    expiresAt: Date.now() + Number(response.data?.expires_in || 600) * 1000,
  }

  return accessToken
}

async function flutterwaveHeaders() {
  const accessToken = await getFlutterwaveAccessToken()
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "X-Trace-Id": crypto.randomUUID(),
    "X-Idempotency-Key": crypto.randomUUID(),
  }

  if ((process.env.FLUTTERWAVE_ENVIRONMENT || "sandbox").toLowerCase() === "sandbox") {
    headers["X-Scenario-Key"] = process.env.FLUTTERWAVE_SCENARIO_KEY || "scenario:auth_redirect"
  }

  return headers
}

export async function initializeFlutterwavePayment(
  params: InitializeFlutterwavePaymentParams
): Promise<FlutterwavePaymentResponse> {
  if (!params.mobileMoney?.countryCode || !params.mobileMoney?.network || !params.mobileMoney?.phoneNumber) {
    throw new Error("Mobile money wallet details are required")
  }

  const baseUrl = flutterwaveBaseUrl()
  const name = splitName(params.customerName)
  const countryCode = params.mobileMoney.countryCode.replace(/\D/g, "")
  const phoneNumber = params.mobileMoney.phoneNumber.replace(/\D/g, "")
  const network = params.mobileMoney.network.toUpperCase()
  const currency = (params.currency || "XAF").toUpperCase()

  let customerId: string | undefined
  try {
    const customerResponse = await axios.post(
      `${baseUrl}/customers`,
      {
        email: params.email,
        name,
        phone: {
          country_code: countryCode,
          number: phoneNumber,
        },
        meta: params.metadata || {},
      },
      { headers: await flutterwaveHeaders() }
    )
    customerId = customerResponse.data?.data?.id
  } catch (error) {
    const axiosError = error as AxiosError<any>
    if (axiosError.response?.status !== 409) {
      console.error("Flutterwave customer creation failed:", axiosError.response?.data || axiosError.message)
      throw new Error(getFlutterwaveErrorMessage(error, "Flutterwave customer creation failed"))
    }

    const searchResponse = await axios.post(
      `${baseUrl}/customers/search`,
      { email: params.email },
      { headers: await flutterwaveHeaders(), params: { page: 1, size: 10 } }
    )
    const customers = searchResponse.data?.data?.items || searchResponse.data?.data || []
    const existingCustomer = Array.isArray(customers)
      ? customers.find((customer: any) => String(customer.email).toLowerCase() === params.email.toLowerCase()) || customers[0]
      : customers
    customerId = existingCustomer?.id
  }

  if (!customerId) throw new Error("Flutterwave customer creation failed")

  const paymentMethodResponse = await axios.post(
    `${baseUrl}/payment-methods`,
    {
      type: "mobile_money",
      mobile_money: {
        country_code: countryCode,
        currency_code: currency,
        network,
        phone_number: phoneNumber,
      },
    },
    { headers: await flutterwaveHeaders() }
  )

  const paymentMethodId = paymentMethodResponse.data?.data?.id
  if (!paymentMethodId) throw new Error("Flutterwave payment method creation failed")

  let chargeResponse
  try {
    chargeResponse = await axios.post(
      `${baseUrl}/charges`,
      {
        amount: params.amount,
        currency,
        reference: params.reference,
        customer_id: customerId,
        payment_method_id: paymentMethodId,
        redirect_url: params.redirect_url,
        meta: params.metadata || {},
      },
      { headers: await flutterwaveHeaders() }
    )
  } catch (error) {
    const axiosError = error as AxiosError<any>
    console.error("Flutterwave charge creation failed:", axiosError.response?.data || axiosError.message)
    throw new Error(getFlutterwaveErrorMessage(error, "Flutterwave charge creation failed"))
  }

  const charge = chargeResponse.data?.data
  const link = charge?.next_action?.redirect_url?.url
  const instruction = charge?.next_action?.payment_instruction?.note
  if (!charge?.id) {
    throw new Error("Flutterwave did not return a charge id")
  }

  return {
    status: chargeResponse.data?.status || "success",
    message: chargeResponse.data?.message || "Charge created",
    data: {
      id: charge.id,
      link: link || params.redirect_url,
      ...(instruction ? { instruction } : {}),
    },
  }
}

export async function verifyFlutterwavePayment(
  reference: string,
  chargeId?: string
): Promise<FlutterwaveVerifyResponse> {
  if (!chargeId) {
    throw new Error("Flutterwave V4 charge id is required for verification")
  }

  const response = await axios.get(`${flutterwaveBaseUrl()}/charges/${chargeId}`, {
    headers: await flutterwaveHeaders(),
  })

  return {
    status: response.data?.status || "success",
    message: response.data?.message || "Charge fetched",
    data: {
      ...response.data?.data,
      tx_ref: response.data?.data?.reference || reference,
      created_at: response.data?.data?.created_datetime,
    },
  }
}

export function generateFlutterwaveReference() {
  return `flw-sub-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
