import type { AppItem, DashboardConfig } from '../config/types'
import { fetchWithTimeout } from '../../lib/fetchWithTimeout'
import { throwIfNotOk } from '../../lib/httpError'

const apiTimeoutMs = 15_000

export async function createApp(paneId: string, app: AppItem): Promise<DashboardConfig> {
  const res = await fetchWithTimeout(
    `/api/panes/${paneId}/apps`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(app),
    },
    apiTimeoutMs,
  )
  await throwIfNotOk(res)
  return res.json() as Promise<DashboardConfig>
}

export async function updateApp(
  paneId: string,
  appId: string,
  patch: Partial<{ name: string; position: string; url: string; icon: string; openInNewTab: boolean }>,
): Promise<DashboardConfig> {
  const res = await fetchWithTimeout(
    `/api/panes/${paneId}/apps/${appId}`,
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

export async function deleteApp(paneId: string, appId: string): Promise<DashboardConfig> {
  const res = await fetchWithTimeout(
    `/api/panes/${paneId}/apps/${appId}`,
    { method: 'DELETE' },
    apiTimeoutMs,
  )
  await throwIfNotOk(res)
  return res.json() as Promise<DashboardConfig>
}

