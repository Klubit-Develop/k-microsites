import { createFileRoute, redirect, useBlocker } from '@tanstack/react-router'
import RegisterPage from '@/pages/Register';

const RegisterPageWrapper = () => {
  useBlocker({
    shouldBlockFn: () => true,
  });

  return <RegisterPage />;
};

export const Route = createFileRoute('/register')({
  component: RegisterPageWrapper,
  beforeLoad: async ({ location }) => {
    const state = location.state as { country?: string; phone?: string };

    if (!state?.country || !state?.phone) {
      throw redirect({ to: '/' });
    }
  },
})