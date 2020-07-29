hooks:

- useAnchorProps
- useIsActive
- useRequest
- usePendingRequest
- useRouter

other functions:

- getRoute

- renderResponseHead

  pass this to `onAfterResponseRendered` to render `response.head` to
  document.title and document.head

components:

- <HashScrollBehavior>
- <Link>
- <Router>
- <RouterEnvironment>
- <RouteContent>
- <RouteErrorBoundary>
- <RouteLoadingIndicator>
  renders its children only when there's a route loading. if no children are
  provided, renders a portal across the top of the page by default
- <RouteNotFoundBoundary>

router fns:

- createRedirectRouter(redirect | req => Promise<redirect> | redirect)

- memoizeRouter((req, res) => content, getKeys?: (req) => any[])

  wraps req/res in a proxy and records which parts were accessed (and written
  for the response), so that the function doesn't need to be run again until
  necessary. if you want to manually specify the keys for the memoization, you
  can pass a second argument which returns a list of keys from the req, any of
  which changing will cause the function to reexecute.

- createAsyncRouter((req, res) => Promise<content>, getKeys?: (req) => any[])

  returns a wrapper that suspends until the promised content is available,
  and sets the `pending` property on the response.

  uses memoizedRouter under the hood

- createLazyRouter(() => Promise<{ default: routerOptions }>)

  this wraps `suspendingRouter`. it's only exported as a separate function as it
  makes working with dynamic imports easier. I don't want to automatically use
  any `default` property in `asyncRouter` as I've had experience that it can be
  confusing and a PITA.

- normalizeRouter(router)

  used internally by default. exported just in case.

- provideRequest(router)

  wraps the content in a provider that sets the request in the router context.
  this is called by default on any router passed to `createRouter` and
  `createAsyncRouter`, including nested routers.

- createRouter(routerOptions)

  eventually, routerOptions can be:

  * an element
  * a router
  * an async router (i.e. a router that returns a promise)
  * an object mapping mount paths to routerOptions (append '*' for nested routes)

  eventually, `useRouter` expects to receive routerOptions too, so if you'd
  like, you can completely avoid creating your own routers.

  I think it'll be easier to type if we use the router functions though, so
  let's start that way.

---

for the functions in content, redirect, response & transformRequest,
`request` is a Proxy that tracks the data that was accessed and stores
it in a closure. this way, at the next request, the function only needs
to be re-run if data that the function depends on has changed.

it's possible to also pass in a `request.mutableCache` object which can be used
instead of the default closure object, for use in SSR.

instead of trying to implement this myself, it makes sense to work with
someone like the local proxy caching guy.

---

recipes:

- to use a different pending content, use transformResponse,
  or transform the default pending content in the request

---

useRouter()

- takes a router: req => res fn
- recomputes when the router changes, when the history changes, or when the
  previous response's pending promise resolves
- adds an empty object `cache` to the request, which can be used to identify
  each request
- adds a `defaultPendingContent` element to the request, which will be set
  as the content for pending requests by default. this content will throw a
  promise that resolves once the next route has been rendered.
- stores state on a WeakMap keyed by the current location. if a history isn't
  provided, defaults to using a global browser history exported by the app.
- if an `initialResponse` is received, that'll be used for the initial location
  as-is. If this is a pending response, it'll be be awaited as any other
  pending response.
- the content is wrapped in a provider which passes down the current pending
  promise

getInitialResponse({ router, url })

- returns a promise to a full non-pending response
