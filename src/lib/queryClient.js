import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 min — content tables change rarely, but
      gcTime: 30 * 60 * 1000,
      // refetch when the tab regains focus so edits made in the shared admin
      // DB show up without a manual page reload.
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
})
