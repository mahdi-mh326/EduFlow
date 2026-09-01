import { apiClient } from './client'

export interface Payment {
  _id: string
  studentId: string
  courseId: {
    _id: string
    title: string
    slug: string
    thumbnail?: string
    price: number
  }
  classId: {
    _id: string
    batchName: string
    startDate: string
    endDate: string
  }
  amount: number
  currency: string
  gateway: string
  transactionId: string
  bankTransactionId?: string
  valId?: string
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
  paymentMethod?: string
  paidAt?: string
  enrolledAt?: string
  createdAt: string
  updatedAt: string
}

export interface InitiatePaymentPayload {
  courseId: string
  classId?: string
}


export interface InitiatePaymentResponse {
  paymentId: string
  transactionId: string
  gatewayUrl: string
}

export interface PaymentQueryResult {
  data: Payment[]
  meta?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function redirectToPaymentGateway(gatewayUrl: string): void {
  let destination: URL

  try {
    destination = new URL(gatewayUrl)
  } catch {
    throw new Error('The payment gateway returned an invalid redirect URL.')
  }

  if (!['http:', 'https:'].includes(destination.protocol)) {
    throw new Error('The payment gateway returned an unsafe redirect URL.')
  }

  window.open(destination.toString(), '_blank', 'noopener,noreferrer')
}

export const paymentApi = {
  initiatePayment: async (payload: InitiatePaymentPayload): Promise<InitiatePaymentResponse> => {
    const { data } = await apiClient.post('/payments/initiate', payload)
    return data.data
  },

  getStudentPayments: async (): Promise<Payment[]> => {
    const { data } = await apiClient.get('/payments/student/payments')
    return data.data
  },

  getPaymentById: async (id: string): Promise<Payment> => {
    const { data } = await apiClient.get(`/payments/${id}`)
    return data.data
  },
}
