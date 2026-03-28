import type { DashboardConfig } from '../config/types'
import { fetchWithTimeout } from '../../lib/fetchWithTimeout'
import { throwIfNotOk } from '../../lib/httpError'

const apiTimeoutMs = 15_000

export async function updatePane(
  paneId: string,
  patch: Partial<{ label: string; position: string; appColumns: number; appRows: number }>,
): Promise<DashboardConfig> {
  const res = await fetchWithTimeout(
    `/api/panes/${paneId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    },
    apiTimeoutMs,
  )
  await throwIfNotOk(res)
  return res.json() as Promise<DashboardConfig>
}

export async function deletePane(paneId: string): Promise<DashboardConfig> {
  const res = await fetchWithTimeout(`/api/panes/${paneId}`, { method: 'DELETE' }, apiTimeoutMs)
  await throwIfNotOk(res)
  return res.json() as Promise<DashboardConfig>
}

