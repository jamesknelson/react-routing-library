<h2 align="center">
  React Routing Library
</h2>

<p align="center">
  Concurrent routing that grows with your app.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/react-routing-library"><img alt="NPM" src="https://img.shields.io/npm/v/react-routing-library.svg"></a>
</p>

```
yarn add react-routing-library
```

Okay, so I dare you. Find me a concurrent-mode routing library that's easier to get started with than React Routing Library.

Hell, find me *any* routing library that's simpler than this. I bet you can't.

[Try it on CodeSandbox](https://codesandbox.io/s/react-routing-library-demo-ur9nu?file=/src/App.js)

## Your router just is a function

```tsx
type RouterFunction = (request, response) => ReactNode
```

A router just maps a request to an element. You've seen this before -- its like a React component.

```tsx
import { Router, RouterFunction } from 'react-routing-library'

const router: RouterFunction = request => {
  switch (request.pathname) {
    case '/':
      return <h1>Landing</h1>

    default:
      return <h1>404 page is out for a walk</h1>
  }
}

export default function App() {
  return <Router router={router} />
}
```


## Examples

### Creating router functions the easy way

The `createRouter()` function saves you the effort of writing long switch statements.

```tsx
const settingsRouter = createRouter({
  '/account': <AccountDetails>,
  '/users/:id': (request) => <AccountUser username={request.params.id} />
})
```

You can nest routers -- but you'll need to add `/*` to the end of the path to indicate that any nested path should also be matched.

```tsx
const appRouter = createRouter({
  '/': <Landing />,
  '/settings/*': settingsRouter
})
```

### Redirects

You can declare redirects with `createRedirectRouter`, and React Routing Library will automatically follow them.

```tsx
const appRouter = createRouter({
  '/new-url': <Page />,
  '/old-url': createRedirectRouter('/new-url'),
})
```

Internally, this works by setting the following properties on the response:

```tsx
const router = (request, response) => {
  // ...

  response.status = 302 // or 301
  response.headers.Location = '/new-url'
  // ...
}
```


### App layout and Route content

The `<RouterContent />` element can be used anywhere within your `<Router>` element to render the current route's children. This comes in handy when you'd like to wrap all routes with an application-wide layout.

```tsx
function App() {
  return (
    <Router router={appRouter}>
      <AppLayout>
        <RouterContent />
      </AppLayout>
    </Router>
  )
}

function AppLayout(props) {
  return (
    <>
      <header>
        <nav><a href="/">Home</a></nav>
      </header>
      <main>
        {props.children}
      </main>
    </>
  )
}
```

### Async routes

The `createAsyncRouter()` function allows you to pass a router that returns a *promise* to its content.

```js
const userProfileRouter = createAsyncRouter(
  async request => {
    const profile = await fetchUserProfile(request.params.userId)
    return <UserProfile  />
  },

  // If you're fetching stuff from a server, you can pass a function as a
  // second argument which specifies the cache keys. The router will only
  // be re-run if the next request returns different values for any of
  // these keys.
  request => [request.params.userId]
)
```

Internally, this will be converted into a synchronously rendered React component that suspends until your promise is ready to go.

Because of this, you'll want to wrap the route content in a `<Suspense>` component to decide what to display while the content is loading.

```tsx
const appRouter = createRouter({
  '/user/:userId': userProfileRouter
})

function App() {
  return (
    <Router router={appRouter}>
      <AppLayout>
        <Suspense fallback={<Spinner />}>
          <RouterContent />
        </Suspense>
      </AppLayout>
    </Router>
  )
}
```


### Loading indicators


By default, the previous route will continue to display for up to 3 seconds before a suspense is triggered to render a fallback. This can be configured with the `transitionTimeousMs` prop.

For example, you could disable the fallback completely by setting it to `Infinity`.

```tsx
function App() {
  return (
    <Router router={appRouter} transitionTimeoutMs={Infinity}>
      <AppLayout>
        <Suspense fallback={<Spinner />}>
          <RouterContent />
        </Suspense>
      </AppLayout>
    </Router>
  )
}
```

The `usePendingRequest()` hook allows you to check if there's a request that's been started but is not yet visible to the user.

This comes in handy for creating a generic app-wide page loading indicator.

```tsx
function App() {
  return (
    <Router router={appRouter}>
      <AppLayout>
        <Suspense fallback={<Spinner />}>
          <RouterContent />
        </Suspense>
      </AppLayout>
      <AppRouteLoadingIndicator />
    </Router>
  )
}

function AppRouteLoadingIndicator() {
  const pendingRequest = usePendingRequest()
  return (
    pendingRequest
      ? <div className="AppRouteLoadingIndicator" />
      : null
  )
}
```

### Concurrent mode

*Currently only available on React's experimental branch.*

When you render your app using `createRoot` and pass `unstable_concurrentMode` to your `<Router>` component, the router will transition using `useTransition()` and its content will suspend until ready. This allows you to control fallbacks and loading order using `<Suspense>` and other concurrent-mode APIs.

```tsx
function App() {
  return (
    <Router router={appRouter} unstable_concurrentMode>
      <AppLayout>
        <Suspense fallback={null}>
          <RouterContent />
        </Suspense>
      </AppLayout>
      <AppRouteLoadingIndicator />
    </Router>
  )
}
```

### Authentication

Your router is just a function mapping Requests to React Elements... and the neat thing about this is that your Request objects can be *anything you like*.

Need your routes to behave differently based on the user's current authentication status? Just create a custom router that adds a `currentUser` object to your request -- and then use it in your routers.

```tsx
const indexRouter = createRouter({
  // Return a different route based on the user's login status.
  '/': (request) => request.currentUser ? <Dashboard /> : <Landing />
})

function App() {
  const [currentUser, setCurrentUser] = useState(null)

  // By using `useCallback`, this router will only be recreated when the
  // current user changes. This is important, as the <Router> component will
  // recompute the route whenever the router function changes.
  const appRouter = useCallback<RouterFunction>(
    (request, response) => indexRouter({ ...request, currentUser }, response),
    [currentUser],
  )

  return (
    <Router router={appRouter} />
  )
}
```

### SSR

The `getRoute` function returns a promise to a route that's ready to render.

```tsx
const initialRoute = await getRoute(router, location)
```

You can then wrap your app element with a `<RouterEnvironment initialRoute>` element when rendering server side to ensuring that the pre-computed route is used -- and that your app renders in a single pass.

```tsx
ReactDOMServer.renderToString(
  <RouterEnvironment initialRoute={initialRoute}>
    <App />
  </RouterEnvironment>
)
```

You can also access the full `response` object at `initialRoute.response` -- allowing you to set headers and HTTP status codes from your router functions, and then rendering them as appropriate.


### Not Found Boundaries

TODO


### Prefetching

TODO


### Page head