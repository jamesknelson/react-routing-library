import * as React from 'react'

import { Link, Router, RouterContent, RouterRequest } from '../../src'

function appRouter(req: RouterRequest) {
  switch (req.pathname) {
    case '/':
      return <h1>Welcome!</h1>

    case '/about':
      return <h1>About</h1>

    default:
      return <h1>Not Found</h1>
  }
}

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
        <RouterContent />
      </main>
    </Router>
  )
}
