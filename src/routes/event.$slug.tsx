import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import EventPage from '@/pages/EventPage';

const eventSearchSchema = z.object({
    step: z.coerce.number().int().min(1).max(10).optional().catch(undefined),
    tab: z.enum(['tickets', 'guestlists', 'reservations', 'products', 'promotions']).optional().catch(undefined),
    tickets: z.string().optional().catch(undefined),
    guestlists: z.string().optional().catch(undefined),
    reservations: z.string().optional().catch(undefined),
    products: z.string().optional().catch(undefined),
    promotions: z.string().optional().catch(undefined),
});

export type EventSearchParams = z.infer<typeof eventSearchSchema>;

export const Route = createFileRoute('/event/$slug')({
  component: EventPage,
  validateSearch: eventSearchSchema,
});

