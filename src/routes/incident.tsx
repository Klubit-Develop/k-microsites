import { createFileRoute } from '@tanstack/react-router'
import IncidentPage from '@/pages/Incident';

export const Route = createFileRoute('/incident')({
  component: IncidentPage,
})
