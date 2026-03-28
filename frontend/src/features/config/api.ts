import type { DashboardConfig } from './types'
import { fetchWithTimeout } from '../../lib/fetchWithTimeout'
import { throwIfNotOk } from '../../lib/httpError'

const apiTimeoutMs = 15_000

export async function fetchDashboardConfig(): Promise<DashboardConfig> {
  const res = await fetchWithTimeout('/api/config', undefined, apiTimeoutMs)
  await throwIfNotOk(res)
  return res.json() as Promise<DashboardConfig>
}

export async function updateDashboardConfig(config: DashboardConfig): Promise<void> {
  const res = await fetchWithTimeout(
    '/api/config',
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    },
    apiTimeoutMs,
  )
  await throwIfNotOk(res)
}

