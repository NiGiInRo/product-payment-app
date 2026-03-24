import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { CheckoutPage } from '../pages/checkout-page'
import { CheckoutResultPage } from '../pages/checkout-result-page'
import { ProductPage } from '../pages/product-page'

const router = createBrowserRouter([
  {
    path: '/',
    element: <ProductPage />,
  },
  {
    path: '/checkout',
    element: <CheckoutPage />,
  },
  {
    path: '/checkout/result',
    element: <CheckoutResultPage />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
