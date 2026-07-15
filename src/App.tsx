import { RouterProvider, useRouter } from './router.tsx'
import { Overview } from './dashboard/Overview.tsx'
import { ProjectDetail } from './dashboard/detail/ProjectDetail.tsx'

function Routes() {
  const { route } = useRouter()
  if (route.name === 'project') return <ProjectDetail id={route.id} />
  return <Overview />
}

export default function App() {
  return (
    <RouterProvider>
      <Routes />
    </RouterProvider>
  )
}
