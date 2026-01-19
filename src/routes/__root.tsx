import { Outlet, createRootRouteWithContext, redirect, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Toaster } from 'sonner'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import { useAuthStore, waitForHydration } from '@/stores/authStore'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import useSEO from '@/hooks/useSEO'

import type { QueryClient } from '@tanstack/react-query'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'

interface MyRouterContext {
  queryClient: QueryClient
}

const authRoutes = ['/auth', '/login', '/register', '/verify', '/incident', '/forgot', '/forgot-change', '/oauth'];

const RootComponent = () => {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  useScrollToTop({ behavior: 'smooth' });
  useSEO();

  const isAuthRoute = authRoutes.some(route => location.pathname.startsWith(route));

  return (
    <div className="flex min-h-screen flex-col">
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

      {!isAuthRoute && <Header user={user} />}

      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>

      <Footer />

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
    </div>
  );
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
  beforeLoad: async ({ location }) => {
    await waitForHydration();

    const { token } = useAuthStore.getState();

    const isAuthRoute = authRoutes.some(route => location.pathname.startsWith(route));

    if (token && isAuthRoute) {
      throw redirect({ to: '/' });
    }
  }
})