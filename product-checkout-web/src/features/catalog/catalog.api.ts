import { apiRequest } from '../../services/api-client'
import type { CurrentProduct } from './catalog.types'

export function getCurrentProduct() {
  return apiRequest<CurrentProduct>('/products/current')
}
