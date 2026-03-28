import useSWR from 'swr'

import type { DashboardConfig } from '../features/config/types'
import { fetchDashboardConfig } from '../features/config/api'

export function useDashboardConfig() {
  return useSWR<DashboardConfig>('/api/config', () => fetchDashboardConfig(), {
    revalidateOnFocus: false,
    errorRetryCount: 2,
    errorRetryInterval: 3_000,
    shouldRetryOnError: true,
  })
}

