import { createFileRoute } from '@tanstack/react-router'
import KlaudIAPage from '@/pages/manager/KlaudIA';

export const Route = createFileRoute('/_authenticated/manager/klaudia')({
  component: KlaudIAPage,
})