import { api } from './api'
import type {
  Application,
  CreatedOrder,
  Dashboard,
  EmploymentStep,
  Lender,
  LenderCategory,
  LenderDetail,
  LenderList,
  LoanStep,
  Payment,
  PaymentMethod,
  PersonalStep,
  User,
} from './types'
import type { Locale } from '@/i18n/config'

export const auth = {
  requestOtp: (email: string, locale: Locale) =>
    api<{ resend_after_seconds: number; expires_in_seconds: number }>('/api/auth/otp/request', {
      method: 'POST',
      body: { email, locale },
    }),
  verifyOtp: (email: string, code: string) => api<User>('/api/auth/otp/verify', { method: 'POST', body: { email, code } }),
  logout: () => api<void>('/api/auth/logout', { method: 'POST' }),
  me: () => api<User>('/api/auth/me'),
  session: () => api<{ user: User | null }>('/api/auth/session'),
  updateMe: (body: { full_name?: string; locale?: Locale }) => api<User>('/api/auth/me', { method: 'PATCH', body }),
}

export const applications = {
  list: () => api<Application[]>('/api/applications'),
  start: () => api<Application>('/api/applications', { method: 'POST' }),
  get: (id: string) => api<Application>(`/api/applications/${id}`),
  savePersonal: (id: string, body: PersonalStep) =>
    api<Application>(`/api/applications/${id}/personal`, { method: 'PUT', body }),
  saveEmployment: (id: string, body: EmploymentStep) =>
    api<Application>(`/api/applications/${id}/employment`, { method: 'PUT', body }),
  saveLoan: (id: string, body: LoanStep) => api<Application>(`/api/applications/${id}/loan`, { method: 'PUT', body }),
  submit: (id: string) => api<Application>(`/api/applications/${id}/submit`, { method: 'POST' }),
}

export const lenders = {
  list: (category?: LenderCategory) => api<Lender[]>(`/api/lenders${category ? `?category=${category}` : ''}`),
  get: (slug: string) => api<LenderDetail>(`/api/lenders/${encodeURIComponent(slug)}`),
  unlocked: () => api<LenderList>('/api/me/lenders'),
  downloadUrl: '/api/me/lenders.pdf',
}

export const payments = {
  list: () => api<Payment[]>('/api/payments'),
  createOrder: (method?: PaymentMethod) => api<CreatedOrder>('/api/payments/order', { method: 'POST', body: { method } }),
  mockAuthorize: (orderId: string, method: PaymentMethod) =>
    api<{ order_id: string; provider_payment_id: string; signature: string }>('/api/payments/mock/authorize', {
      method: 'POST',
      body: { order_id: orderId, method },
    }),
  verify: (body: { order_id: string; provider_payment_id: string; signature: string }) =>
    api<Payment>('/api/payments/verify', { method: 'POST', body }),
  invoiceUrl: (paymentId: string) => `/api/payments/${paymentId}/invoice.pdf`,
}

export const account = {
  dashboard: () => api<Dashboard>('/api/me/dashboard'),
  contactSupport: (body: { subject: string; message: string }) =>
    api<{ status: string }>('/api/support', { method: 'POST', body }),
}
