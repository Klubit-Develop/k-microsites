import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/wallet')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/wallet"!</div>
}
