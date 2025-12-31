import { createFileRoute } from '@tanstack/react-router';
import HomePage from '@/pages/Home';

type HomeSearch = {
    view?: string;
};

export const Route = createFileRoute('/')({
    component: HomePage,
    validateSearch: (search: Record<string, unknown>): HomeSearch => ({
        view: search.view as string | undefined,
    }),
});