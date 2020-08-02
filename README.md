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

The `createPatternRouter()` function saves you the effort of writing long switch statements.

```tsx
const settingsRouter = createPatternRouter({
  '/account': <AccountDetails>,
  '/users/:id': (request) => <AccountUser username={request.params.id} />
})
```

You can nest routers -- but you'll need to add `/*` to the end of the path to indicate that any nested path should also be matched.

```tsx
const appRouter = createPatternRouter({
  '/': <Landing />,
  '/settings/*': settingsRouter
})
```

### Redirects

You can declare redirects with `createRedirectRouter`, and React Routing Library will automatically follow them.

```tsx
const appRouter = createPatternRouter({
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

Note that the async function will be re-run each time the request or router changes -- *including* when a hash or authentication changes, so you'll probably want to perform some sort of caching on the client side.

```js
const userProfileRouter = createAsyncRouter(async request => {
  const profile = await fetchUserProfile(request.params.userId, someCache)
  return <UserProfile  />
})
```

The routing function produced by `createAsyncRouter()` will return a synchronously rendered React component that suspends until your promise is ready to go. Because of this, you'll want to wrap the route content in a `<Suspense>` component to decide what to display while the content is loading.

```tsx
const appRouter = createPatternRouter({
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
const indexRouter = createPatternRouter({
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

You can then pass your initial route to the `<Router>` component to skip using the router on the first render.

```tsx
function App(props) {
  // ...

  return (
    <Router router={appRouter} initialRoute={props.initialRoute} />
  )
}

ReactDOMServer.renderToString(
  <App initialRoute={initialRoute} />
)
```

You can also access the full `response` object at `initialRoute.response` -- allowing you to set headers and HTTP status codes from your router functions, and then rendering them as appropriate.


### Not Found Boundaries

When a router returned by `createPatternRouter()` encounters a route that it doesn't understand, it'll throw a `NotFoundError`. You can use a `<NotFoundBoundary>` component to catch this error and render a 404 page until the URL changes again.

```tsx
<Router router={appRouter}>
  <AppLayout>
    <NotFoundBoundary renderError={() => <h1>404 Not Found</h1>}>
      <RouterContent />
    </NotFoundBoundary>
  </AppLayout>
</Router>
```