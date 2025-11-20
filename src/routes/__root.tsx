import { Outlet, createRootRouteWithContext, redirect } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Toaster } from 'sonner'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import { useAuthStore } from '@/stores/authStore'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

// Rutas públicas que deben redirigir si ya está autenticado
const publicRoutes = ['/', '/login', '/register', '/verify']

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
        duration={4000}
      />
      <Outlet />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
          TanStackQueryDevtools,
        ]}
      />
    </>
  ),
  beforeLoad: async ({ location }) => {
    const { token } = useAuthStore.getState();
    
    // Si tiene token y está en una ruta pública, redirigir al área autenticada
    if (token && publicRoutes.includes(location.pathname)) {
      throw redirect({ to: '/manager/klaudia' });
    }
  }
})