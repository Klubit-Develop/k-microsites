import { createFileRoute } from '@tanstack/react-router'
import OauthPage from '@/pages/Oauth';

export const Route = createFileRoute('/oauth')({
    component: OauthPage,
})