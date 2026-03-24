import { configureStore } from '@reduxjs/toolkit'
import catalogReducer from '../features/catalog/catalog.slice'
import checkoutReducer from '../features/checkout/checkout.slice'
import paymentReducer from '../features/payment/payment.slice'
import { loadPersistedState, savePersistedState } from './persistence'

const preloadedState = loadPersistedState()

export const store = configureStore({
  reducer: {
    catalog: catalogReducer,
    checkout: checkoutReducer,
    payment: paymentReducer,
  },
  preloadedState,
})

store.subscribe(() => {
  const state = store.getState()

  savePersistedState({
    checkout: state.checkout,
    payment: state.payment,
  })
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
