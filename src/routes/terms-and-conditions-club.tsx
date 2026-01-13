import { createFileRoute } from '@tanstack/react-router';
import TermsAndConditionsClub from '@/pages/TermsAndConditionsClub';

export const Route = createFileRoute('/terms-and-conditions-club')({
    component: TermsAndConditionsClub,
});