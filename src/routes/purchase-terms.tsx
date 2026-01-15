import { createFileRoute } from '@tanstack/react-router';
import PurchaseTerms from '@/pages/PurchaseTerms';

export const Route = createFileRoute('/purchase-terms')({
  component: PurchaseTerms,
});