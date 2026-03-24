import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../store/store'
import { getCurrentProduct } from './catalog.api'
import type { CurrentProduct } from './catalog.types'

type CatalogRequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

type CatalogState = {
  product: CurrentProduct | null
  status: CatalogRequestStatus
  error: string | null
}

const initialState: CatalogState = {
  product: null,
  status: 'idle',
  error: null,
}

export const fetchCurrentProduct = createAsyncThunk(
  'catalog/fetchCurrentProduct',
  async (_, { rejectWithValue }) => {
    try {
      return await getCurrentProduct()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No fue posible cargar el producto actual.'

      return rejectWithValue(message)
    }
  },
)

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    resetCatalogError(state) {
      state.error = null
    },
    setProductFromCache(state, action: PayloadAction<CurrentProduct>) {
      state.product = action.payload
      state.status = 'succeeded'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentProduct.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchCurrentProduct.fulfilled, (state, action) => {
        state.product = action.payload
        state.status = 'succeeded'
        state.error = null
      })
      .addCase(fetchCurrentProduct.rejected, (state, action) => {
        state.status = 'failed'
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'No fue posible cargar el producto actual.'
      })
  },
})

export const { resetCatalogError, setProductFromCache } = catalogSlice.actions

export const selectCurrentProduct = (state: RootState) => state.catalog.product
export const selectCatalogStatus = (state: RootState) => state.catalog.status
export const selectCatalogError = (state: RootState) => state.catalog.error

export default catalogSlice.reducer
