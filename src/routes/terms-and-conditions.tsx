import { createFileRoute } from '@tanstack/react-router';
import TermsAndConditions from '@/pages/TermsAndConditions';

export const Route = createFileRoute('/terms-and-conditions')({
    component: TermsAndConditions,
});