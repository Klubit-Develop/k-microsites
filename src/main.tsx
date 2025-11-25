import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'

import * as TanStackQueryProvider from '@/integrations/tanstack-query/root-provider.tsx'
import { SocketProvider } from '@/integrations/socket/socket-provider.tsx'

import { routeTree } from './routeTree.gen'

import './i18n/config';
import './styles.css'
import './sonner-custom.css'
import reportWebVitals from './reportWebVitals.ts'

const TanStackQueryProviderContext = TanStackQueryProvider.getContext()
const router = createRouter({
  routeTree,
  context: {
    ...TanStackQueryProviderContext,
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
        <SocketProvider>
          <RouterProvider router={router} />
        </SocketProvider>
      </TanStackQueryProvider.Provider>
    </StrictMode>,
  )
}

reportWebVitals()