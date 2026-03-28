export type ApiErrorJSON = {
  code?: string
  message?: string
  error?: string
  field?: string
}

export class HttpError extends Error {
  readonly status: number
  readonly code?: string
  readonly field?: string

  constructor(status: number, message: string, code?: string, field?: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.field = field
  }
}

export async function throwIfNotOk(res: Response): Promise<void> {
  if (res.ok) return
  const text = await res.text().catch(() => '')
  let message = text || `Request failed (${res.status})`
  let code: string | undefined
  let field: string | undefined
  try {
    const j = JSON.parse(text) as ApiErrorJSON
    if (typeof j.message === 'string' && j.message) {
      message = j.message
    } else if (typeof j.error === 'string' && j.error) {
      message = j.error
    }
    if (typeof j.code === 'string') code = j.code
    if (typeof j.field === 'string') field = j.field
  } catch {
    // keep raw text as message
  }
  throw new HttpError(res.status, message, code, field)
}
