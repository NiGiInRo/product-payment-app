export type CurrencyCode = 'COP'

export type CurrentProduct = {
  id: string
  name: string
  description: string
  priceCents: number
  stock: number
  imageUrl: string
  currency: CurrencyCode
}
