import { createFileRoute } from '@tanstack/react-router'
import RrppPage from '@/pages/Rrpp';

export const Route = createFileRoute('/rrpp/$slug')({
  component: RrppPage,
})