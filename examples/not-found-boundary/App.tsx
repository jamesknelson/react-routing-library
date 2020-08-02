import * as React from 'react'

import {
  Link,
  NotFoundBoundary,
  Router,
  RouterContent,
  createPatternRouter,
} from '../../src'

const appRouter = createPatternRouter({
  '/': <h1>Welcome!</h1>,
  '/about': <h1>About</h1>,
})

export function App() {
  return (
    <Router router={appRouter} unstable_concurrentMode>
      <nav>
        <Link to="/">Home</Link>
        &nbsp;&middot;&nbsp;
        <Link to="/about">About</Link>
        &nbsp;&middot;&nbsp;
        <Link to="/not-found">Not Found</Link>
      </nav>
      <main>
        <NotFoundBoundary renderError={() => <h1>404 Not Found</h1>}>
          <RouterContent />
        </NotFoundBoundary>
      </main>
    </Router>
  )
}
