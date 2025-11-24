import { Outlet, createRootRouteWithContext, redirect } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Toaster } from 'sonner'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import { useAuthStore } from '@/stores/authStore'

import type { QueryClient } from '@tanstack/react-query'
import Sidebar from '@/components/common/Sidebar'

interface MyRouterContext {
  queryClient: QueryClient
}

const publicRoutes = ['/', '/login', '/register', '/verify', '/incident', '/forgot', '/forgot-change'];

const RootComponent = () => {
  const { token } = useAuthStore();

  return (
    <>
      <Toaster
        position="bottom-right"
        expand={false}
        richColors
        duration={4000}
        toastOptions={{
          style: {
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: '14px',
            borderRadius: '10px',
            padding: '16px',
            gap: '8px',
          },
          classNames: {
            toast: 'sonner-toast',
            title: 'sonner-title',
            description: 'sonner-description',
            success: 'sonner-success',
            error: 'sonner-error',
            warning: 'sonner-warning',
            info: 'sonner-info',
          },
        }}
      />

      {token && <Sidebar />}
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
  );
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
  beforeLoad: async ({ location }) => {
    const { token } = useAuthStore.getState();

    if (token && publicRoutes.includes(location.pathname)) {
      throw redirect({ to: '/manager/klaudia' });
    }
  }
})