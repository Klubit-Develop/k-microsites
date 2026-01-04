import { createFileRoute } from '@tanstack/react-router';
import LegalNotice from '@/pages/LegalNotice';

export const Route = createFileRoute('/legal-notice')({
    component: LegalNotice,
});