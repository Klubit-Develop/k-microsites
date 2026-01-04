import { createFileRoute } from '@tanstack/react-router'
import ProfilePage from '@/pages/Profile';

export const Route = createFileRoute('/_authenticated/profile')({
  component: ProfilePage,
})