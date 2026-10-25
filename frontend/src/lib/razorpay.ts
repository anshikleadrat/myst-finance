import type { CreatedOrder, PaymentMethod } from './types'

type RazorpaySuccess = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
type RazorpayInstance = { open: () => void; on: (event: 'payment.failed', handler: (response: unknown) => void) => void }
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor
  }
}

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'
let scriptPromise: Promise<RazorpayConstructor> | null = null

/** Load Razorpay Checkout on demand (only when the user clicks Pay). */
function loadCheckout(): Promise<RazorpayConstructor> {
  if (window.Razorpay) return Promise.resolve(window.Razorpay)
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error('Razorpay failed to load')))
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Razorpay failed to load'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

export type CheckoutOutcome =
  | { status: 'success'; order_id: string; provider_payment_id: string; signature: string }
  | { status: 'dismissed' }
  | { status: 'failed' }

export async function openRazorpayCheckout(order: CreatedOrder, method: PaymentMethod, description: string): Promise<CheckoutOutcome> {
  const Razorpay = await loadCheckout()
  return new Promise((resolve) => {
    const instance = new Razorpay({
      key: order.key_id,
      order_id: order.order_id,
      amount: order.amount_paise,
      currency: order.currency,
      name: order.business_name,
      description,
      prefill: { ...order.prefill, method },
      theme: { color: '#0b40b8' },
      handler: (response: RazorpaySuccess) =>
        resolve({
          status: 'success',
          order_id: response.razorpay_order_id,
          provider_payment_id: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        }),
      modal: { ondismiss: () => resolve({ status: 'dismissed' }) },
    })
    instance.on('payment.failed', () => resolve({ status: 'failed' }))
    instance.open()
  })
}
