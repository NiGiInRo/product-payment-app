import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../store/store'
import type {
  CheckoutConfig,
  PaymentSubmissionStage,
  TransactionResult,
  TransactionStatus,
} from './payment.types'

export type PaymentState = {
  checkoutConfig: CheckoutConfig | null
  configStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  configError: string | null
  transactionId: string | null
  status: 'idle' | TransactionStatus
  statusReason: string | null
  finalResult: TransactionResult | null
  submissionStage: PaymentSubmissionStage
  error: string | null
}

export const initialPaymentState: PaymentState = {
  checkoutConfig: null,
  configStatus: 'idle',
  configError: null,
  transactionId: null,
  status: 'idle',
  statusReason: null,
  finalResult: null,
  submissionStage: 'idle',
  error: null,
}

const paymentSlice = createSlice({
  name: 'payment',
  initialState: initialPaymentState,
  reducers: {
    startCheckoutConfigLoad(state) {
      state.configStatus = 'loading'
      state.configError = null
    },
    setCheckoutConfig(state, action: PayloadAction<CheckoutConfig>) {
      state.checkoutConfig = action.payload
      state.configStatus = 'succeeded'
      state.configError = null
    },
    setCheckoutConfigError(state, action: PayloadAction<string>) {
      state.configStatus = 'failed'
      state.configError = action.payload
    },
    setPaymentTransactionId(state, action: PayloadAction<string | null>) {
      state.transactionId = action.payload
    },
    setPaymentSubmissionStage(state, action: PayloadAction<PaymentSubmissionStage>) {
      state.submissionStage = action.payload
    },
    setPaymentPending(
      state,
      action: PayloadAction<{
        transactionId: string
      }>,
    ) {
      state.transactionId = action.payload.transactionId
      state.status = 'PENDING'
      state.statusReason = null
      state.error = null
      state.finalResult = null
    },
    setPaymentResult(state, action: PayloadAction<TransactionResult>) {
      state.transactionId = action.payload.transactionId
      state.status = action.payload.status
      state.statusReason = action.payload.statusReason ?? null
      state.finalResult = action.payload
      state.error = null
      state.submissionStage = 'idle'
    },
    setPaymentError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },
    clearPaymentAttempt(state) {
      state.transactionId = null
      state.status = 'idle'
      state.statusReason = null
      state.finalResult = null
    },
    clearPaymentError(state) {
      state.error = null
    },
    resetPaymentState(state) {
      state.checkoutConfig = null
      state.configStatus = 'idle'
      state.configError = null
      state.transactionId = null
      state.status = 'idle'
      state.statusReason = null
      state.finalResult = null
      state.submissionStage = 'idle'
      state.error = null
    },
  },
})

export const {
  clearPaymentAttempt,
  clearPaymentError,
  resetPaymentState,
  setCheckoutConfig,
  setCheckoutConfigError,
  setPaymentError,
  setPaymentPending,
  setPaymentResult,
  setPaymentSubmissionStage,
  setPaymentTransactionId,
  startCheckoutConfigLoad,
} = paymentSlice.actions

export const selectPayment = (state: RootState) => state.payment
export const selectCheckoutConfig = (state: RootState) => state.payment.checkoutConfig
export const selectPaymentTransactionId = (state: RootState) =>
  state.payment.transactionId
export const selectPaymentFinalResult = (state: RootState) =>
  state.payment.finalResult

export default paymentSlice.reducer
