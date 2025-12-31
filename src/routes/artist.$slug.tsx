import { createFileRoute } from '@tanstack/react-router'
import ArtistPage from '@/pages/Artist';

export const Route = createFileRoute('/artist/$slug')({
  component: ArtistPage,
})