const DEFAULT_API_URL = 'http://localhost:3000'

const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '')

type ApiErrorPayload = {
  message?: string | string[]
}

export class ApiError extends Error {
  public readonly status: number

  constructor(
    message: string,
    status: number,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null

    try {
      payload = (await response.json()) as ApiErrorPayload
    } catch {
      payload = null
    }

    const fallbackMessage = 'La API no respondió como se esperaba.'
    const message = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : payload?.message || fallbackMessage

    throw new ApiError(message, response.status)
  }

  return (await response.json()) as T
}
