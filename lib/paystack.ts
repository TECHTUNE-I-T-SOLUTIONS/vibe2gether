import axios from 'axios'

const PAYSTACK_BASE_URL = 'https://api.paystack.co'
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

interface InitializePaymentParams {
  email: string
  amount: number // in kobo (1 naira = 100 kobo)
  reference?: string
  metadata?: Record<string, any>
  callback_url?: string
}

interface InitializePaymentResponse {
  status: boolean
  message: string
  data?: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

interface VerifyPaymentResponse {
  status: boolean
  message: string
  data?: {
    id: number
    reference: string
    amount: number
    paid_at: string
    customer: {
      id: number
      email: string
    }
    status: string
  }
}

export async function initializePayment(
  params: InitializePaymentParams
): Promise<InitializePaymentResponse> {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: params.email,
        amount: params.amount,
        reference: params.reference,
        metadata: params.metadata,
        callback_url: params.callback_url,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('[Paystack] Payment initialized:', response.data.data?.reference)
    return response.data
  } catch (error) {
    console.error('[Paystack] Error initializing payment:', error)
    throw error
  }
}

export async function verifyPayment(
  reference: string
): Promise<VerifyPaymentResponse> {
  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('[Paystack] Payment verified:', reference, 'Status:', response.data.data?.status)
    return response.data
  } catch (error) {
    console.error('[Paystack] Error verifying payment:', error)
    throw error
  }
}

export async function createTransferRecipient(
  account_number: string,
  bank_code: string,
  name: string
) {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transferrecipient`,
      {
        type: 'nuban',
        account_number,
        bank_code,
        name,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('[Paystack] Transfer recipient created:', response.data.data?.recipient_code)
    return response.data
  } catch (error) {
    console.error('[Paystack] Error creating transfer recipient:', error)
    throw error
  }
}

export async function initiateTransfer(
  recipient_code: string,
  amount: number,
  reference: string,
  reason?: string
) {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transfer`,
      {
        source: 'balance',
        recipient_code,
        amount,
        reference,
        reason,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('[Paystack] Transfer initiated:', response.data.data?.transfer_code)
    return response.data
  } catch (error) {
    console.error('[Paystack] Error initiating transfer:', error)
    throw error
  }
}

export function generatePaystackReference() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
