import axios from "axios"

const FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3"
const FLUTTERWAVE_SECRET = process.env.FLUTTERWAVE_CLIENT_SECRET || process.env.FLUTTERWAVE_SECRET_KEY

type InitializeFlutterwavePaymentParams = {
  email: string
  amount: number
  currency: string
  reference: string
  redirect_url: string
  customerName?: string
  metadata?: Record<string, any>
}

type FlutterwavePaymentResponse = {
  status: string
  message: string
  data?: {
    link: string
  }
}

type FlutterwaveVerifyResponse = {
  status: string
  message: string
  data?: {
    id: number
    tx_ref: string
    flw_ref: string
    amount: number
    currency: string
    charged_amount: number
    status: string
    created_at: string
    customer?: {
      email: string
      name?: string
    }
  }
}

function flutterwaveHeaders() {
  if (!FLUTTERWAVE_SECRET) {
    throw new Error("Flutterwave secret is not configured")
  }

  return {
    Authorization: `Bearer ${FLUTTERWAVE_SECRET}`,
    "Content-Type": "application/json",
  }
}

export async function initializeFlutterwavePayment(
  params: InitializeFlutterwavePaymentParams
): Promise<FlutterwavePaymentResponse> {
  const response = await axios.post(
    `${FLUTTERWAVE_BASE_URL}/payments`,
    {
      tx_ref: params.reference,
      amount: params.amount,
      currency: params.currency,
      redirect_url: params.redirect_url,
      customer: {
        email: params.email,
        name: params.customerName || params.email,
      },
      customizations: {
        title: "Vibe2Gether Subscription",
        description: "Subscription service payment",
        logo: "https://www.vibe2gether.com/v2g-logo.png",
      },
      meta: params.metadata,
    },
    { headers: flutterwaveHeaders() }
  )

  return response.data
}

export async function verifyFlutterwavePayment(reference: string): Promise<FlutterwaveVerifyResponse> {
  const response = await axios.get(
    `${FLUTTERWAVE_BASE_URL}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
    { headers: flutterwaveHeaders() }
  )

  return response.data
}

export function generateFlutterwaveReference() {
  return `flw-sub-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
