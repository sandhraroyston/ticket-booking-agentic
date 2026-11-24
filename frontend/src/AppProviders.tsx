import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { createQueryClient } from './queryClient.ts'

interface AppProvidersProps {
  children: ReactNode
  queryClient?: QueryClient
}

export function AppProviders({ children, queryClient }: AppProvidersProps) {
  const [client] = useState(() => queryClient ?? createQueryClient())
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
