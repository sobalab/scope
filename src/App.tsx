import { RouterProvider, useRouter } from './ardent/router.tsx'
import { Board } from './ardent/board/Board.tsx'
import { EventDetail } from './ardent/detail/EventDetail.tsx'

function Routes() {
  const { route } = useRouter()
  if (route.name === 'event') return <EventDetail id={route.id} />
  return <Board />
}

export default function App() {
  return (
    <RouterProvider>
      <Routes />
    </RouterProvider>
  )
}
