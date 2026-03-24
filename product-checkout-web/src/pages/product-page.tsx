import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchCurrentProduct,
  selectCatalogError,
  selectCatalogStatus,
  selectCurrentProduct,
} from '../features/catalog/catalog.slice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { formatCurrency } from '../utils/formatters'

export function ProductPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const product = useAppSelector(selectCurrentProduct)
  const status = useAppSelector(selectCatalogStatus)
  const error = useAppSelector(selectCatalogError)
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchCurrentProduct())
    }
  }, [dispatch, status])

  const isLoading = status === 'loading' && !product
  const isOutOfStock = (product?.stock ?? 0) <= 0
  const imageFailed = failedImageUrl === product?.imageUrl

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Checkout mobile-first</span>
          <h1 className="page-title">Compra un solo producto con un flujo simple y real</h1>
          <p className="page-copy">
            El frontend ya consume el producto real, captura checkout, tokeniza
            tarjeta en sandbox y recupera el estado final de la compra con el
            backend como fuente de verdad.
          </p>
          <div className="hero-points">
            <span>Producto activo desde API</span>
            <span>Checkout persistente tras refresh</span>
            <span>Pago real conectado al sandbox</span>
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="surface">
          <div className="loading-block">
            <div className="loading-line loading-line-wide"></div>
            <div className="loading-line"></div>
            <div className="loading-card"></div>
          </div>
        </section>
      ) : null}

      {error && !product ? (
        <section className="surface">
          <div className="status-card status-card-error">
            <p className="status-title">No se pudo cargar el producto</p>
            <p className="status-copy">{error}</p>
            <button
              className="button button-primary"
              onClick={() => void dispatch(fetchCurrentProduct())}
              type="button"
            >
              Reintentar
            </button>
          </div>
        </section>
      ) : null}

      {product ? (
        <section className="product-grid">
          <article className="surface product-media">
            {!imageFailed ? (
              <img
                alt={product.name}
                className="product-image"
                onError={() => setFailedImageUrl(product.imageUrl)}
                src={product.imageUrl}
              />
            ) : (
              <div className="image-fallback" aria-hidden="true">
                <span>Imagen no disponible</span>
              </div>
            )}
          </article>

          <article className="surface product-summary">
            <div className="product-header">
              <span className={`stock-pill ${isOutOfStock ? 'stock-pill-empty' : ''}`}>
                {isOutOfStock ? 'Sin stock' : `${product.stock} unidades disponibles`}
              </span>
              <p className="muted-label">Producto actual</p>
              <h2 className="product-title">{product.name}</h2>
              <p className="product-description">{product.description}</p>
            </div>

            <dl className="product-meta">
              <div>
                <dt>Precio</dt>
                <dd>{formatCurrency(product.priceCents, product.currency)}</dd>
              </div>
              <div>
                <dt>Moneda</dt>
                <dd>{product.currency}</dd>
              </div>
            </dl>

            <button
              className="button button-primary"
              disabled={isOutOfStock}
              onClick={() => navigate('/checkout')}
              type="button"
            >
              {isOutOfStock ? 'Producto agotado' : 'Iniciar checkout'}
            </button>

            <p className="helper-copy">
              Si el pago termina aprobado, al volver aquí deberías ver el stock
              actualizado desde el backend.
            </p>
          </article>
        </section>
      ) : null}
    </main>
  )
}
