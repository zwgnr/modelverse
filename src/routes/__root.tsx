import { Loader } from '@/components/ui/loader'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { useConvexAuth } from 'convex/react'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const { isLoading } = useConvexAuth()
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader variant="bars" size="lg" />
      </div>
    )
  }

  return (
    <div className="font-geist-sans">
      <Outlet />
      {/* <TanStackRouterDevtools position="bottom-left" /> */}
    </div>
  )
} 