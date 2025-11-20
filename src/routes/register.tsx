import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/register')({
  component: RouteComponent,
  beforeLoad: async ({ location }) => {
    const state = location.state as { country?: string; phone?: string };

    if (!state?.country || !state?.phone) {
      throw redirect({ to: '/' });
    }
  }
})

function RouteComponent() {
  return <div>Hello "/register"!</div>
}