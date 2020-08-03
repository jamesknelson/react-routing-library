# API Reference

[**Components**](/docs/api.md#components)

- [`<RoutingProvider>`](/docs/api.md#routingprovider)
- [`<Content>`](/docs/api.md#content)
- [`<Link>`](/docs/api.md#link)
- [`<NotFoundBoundary>`](/docs/api.md#notfoundboundary)

[**Hooks**](/docs/api.md#hooks)

- [`useContent()`](/docs/api.md#usecontent)
- [`useIsActive()`](/docs/api.md#useisactive)
- [`useLink()`](/docs/api.md#uselink)
- [`useNavigation()`](/docs/api.md#usenavigation)
- [`usePendingRequest()`](/docs/api.md#usependingrequest)
- [`useRequest()`](/docs/api.md#userequest)

[**Router helpers**](/docs/api.md#router-helpers)

- [`createAsyncRouter()`](/docs/api.md#createasyncrouter)
- [`createLazyRouter()`](/docs/api.md#createlazyrouter)
- [`createPatternRouter()`](/docs/api.md#createpatternrouter)
- [`createRedirectRouter()`](/docs/api.md#createredirectrouter)

[**Functions**](/docs/api.md#functions)

- [`createHref()`](/docs/api.md#createhref)
- [`getRoute()`](/docs/api.md#getroute)
- [`parseHref()`](/docs/api.md#parsehref)

[**Error handling**](/docs/api.md#error-handling)

- [`NotFoundError`](/docs/api.md#notfounderror)
- [`notFoundRouter`](/docs/api.md#notfoundrouter)

[**Types**](/docs/api.md#types)

- [`GetRouteOptions`](/docs/api.md#getrouteoptions)
- [`Route`](/docs/api.md#route)
- [`Router`](/docs/api.md#router)
- [`RouterDelta`](/docs/api.md#routerdelta)
- [`RouterNavigation`](/docs/api.md#routernavigation)
- [`RouterRequest`](/docs/api.md#routerrequest)
- [`RouterResponse`](/docs/api.md#routerresponse)
- [`UseLinkOptions`](/docs/api.md#uselinkoptions)

## Components

### `<RoutingProvider>`

This component goes at the top level of your app, configuring your app's routing and providing the routing context required by all other components and hooks.

#### Props

- `router` - **required** - `Router`

  A function that returns the content for each new location that the user navigates to.
  
  Typically, you'll use router helpers like `createPatternRouter()` to create this function.

- `basename` - *optional* - `string`

  If specified, this will be added to the `basename` property of each the router's requests - ensuring that when this string appears at the beginning of the current URL, it'll be ignored by `createPatternRouter()` and other router helpers.

  Use this when you need to mount a RRL router under a subdirectory.

- `initialRoute` - *optional* - `Route`

  If provided with a `Route` object (as returned by the promise returned by `getRoute()`), this prop will be used as the current route until the first effect is able to be run.

  As effects will not run during server side rendering, this is useful for SSR. This can also be used to load asynchronous routes in legacy-mode React.
  
- `onResponseComplete` - *optional* - `(res: RouterResponse, req: RouterRequest) => void`

  If provided, this will be called with the final response object once a router has returned its final non-pending value.

  This is the only way to access the Response object outside of calling `getRoute()` directly, as response objects will not always be available on the initial render in concurrent mode due to partial hydration.

- `transitionTimeoutMs` - *optional* - `number`

  *Defaults to 3000ms.*

  This value specifies the amount of time that the router should wait for asynchronous and suspenseful content to load before going ahead and rendering an incomplete route anyway.

  If you'd like to always immediately render each new route, set this to 0. If you'd like to always wait until each route is fully loaded before rendering, set this to `Infinity`.

- `unstable_concurrentMode` - *optional* - `boolean`

  Set this to `true` to opt into using React's concurrent mode internally for transitions (i.e. `useTransition()`). Note, this feature will only work when using React's experimental branch, and when rendering your app with `createRoot()`.
  
  This should have no affect on the router's behavior itself, but may improve performance and allow you to use concurrent mode features like `<SuspenseList>` alongside routing components like `<Content>`.


### `<Content>`

Renders the current route's content.

This component will suspend if rendering lazy or async content that is still pending, and will throw an error if something goes wrong while loading your request's content.

To access the content element directly, e.g. to create animated transitions, use the `useContent()` hook -- this component uses it internally.

#### Examples

Typically, you'll want to render the content inside a component that renders any fixed layout (e.g. a navbar), and inside a `<Suspense>` that renders a fallback until any async or lazy routes have loaded.

```tsx
export default function App() {
  return (
    <RoutingProvider router={appRouter}>
      <AppLayout>
        <React.Suspense fallback={<AppSpinner />}>
          <Content />
        </React.Suspense>
      </AppLayout>
    </RoutingProvider>
  )
}
```

### `<Link>`

Renders an `<a>` element that'll update the route when clicked.

To create custom link components, use the `useLink()` and `useIsActive()` hooks -- this component uses them internally.

#### Props

Accepts most props that the standard `<a>` does, along with:

- `to` - **required** - `string | RouterDelta`

  The address to which the link should navigate on click. Can be an `/absolute` string, a string `./relative` to the current route, or a *RouterDelta* object containing one or more of the keys `pathname`, `search`, `hash`, `query` or `state`.

- `active` - *optional* - `boolean`

  Specify this to override whether this link is considered active (when deciding whether to apply `activeClassName` and `activeStyles`).

- `activeClassName` - *optional* - `string`

  A CSS class to apply to the rendered `<a>` element when the user is currently viewing the `pathname` underneath that specified by the `to` prop.

- `activeStyle` - *optional* - `object`

  A CSS style object to apply to the rendered `<a>` element when the user is currently viewing a `pathname` underneath that specified by the `to` prop.

- `disabled` - *optional* - `boolean`

  If `true`, clicking the link will not result in any action being taken.

- `exact` - *optional* - `boolean`

  If `true`, `activeClassName` and `activeStyle` will only be displayed if viewing the exact pathname specified by `to` - and not when viewing a descendent of it.

- `prefetch` - *optional* - `'hover' | 'mount'`

  If specified, a request with method `head` will be executed in the background when the user hovers over the link, or when the link is first mounted.

  Use this to improve performance by eagerly loading lazy routes.

- `replace` - *optional* - `boolean`

  Specifies that instead of pushing a new entry onto the browser history, the link should replace the existing entry.

- `state` - *optional* - `object`

  Specifies a state object to associate with the browser history entry.
  
  In requests produced by clicking the link, this `state` will be available at `request.state`.

#### Examples

```tsx
export function AppLayout({ children }) {
  return (
    <>
      <nav>
        <Link to="/" exact activeClassName="active" prefetch="hover">Home</Link>
        &nbsp;&middot;&nbsp;
        <Link to="/about" activeClassName="active" prefetch="hover">About</Link>
      </nav>
      <main>
        {children}
      </main>
    </>
  )
}
```

### `<NotFoundBoundary>`

Use this to catch any `NotFoundError` thrown your `<Content>` element, and render a user-friendly error message in its place.

#### Props

- `renderError` - **required** - `(error: NotFoundError) => ReactNode`

  This function should return a React Element that renders your Not Found message.

#### Examples

Generally, you'll want to place a `<NotFoundBoundary>` *within* your app's layout element, but *around* your `<Content>` element. This ensures that your not found message will be rendered inside your app layout.

```tsx
export default function App() {
  return (
    <RoutingProvider router={appRouter}>
      <AppLayout>
        <React.Suspense fallback={<AppSpinner />}>
          <NotFoundBoundary renderError={() => <AppNotFoundPage />}>
            <Content />
          </NotFoundBoundary>
        </React.Suspense>
      </AppLayout>
    </RoutingProvider>
  )
}
```


## Hooks

### `useContent()`

```tsx
const contentElement = useContent()
```

### `useIsActive()`

```tsx
const isActive = useIsActive(href, options?)
```

Returns `true` if the current request matches the specified `href`. If an `exact` option is passed, an exact match is required. Otherwise, any child of the specified `href` will also be considered a match.

#### Options

- `exact` - *optional* - `boolean`

  If `true`, the current route will only be considered active if it exactly matches the `href` passed as the first argument.

### `useLink()`

```tsx
const linkProps = useLink(href, options?)
```

Returns a props object that can be spread onto an `<a>` element to create links that integrate with the router.

These props can also be spread onto `<button>` and other components -- just remove the `href` prop.

#### Options

- `disabled` - *optional* - `boolean`

  If `true`, clicking the link will not result in any action being taken.

- `onClick` - *optional* - `Function`

- `onMouseEnter` - *optional* - `Function`

- `prefetch` - *optional* - `'hover' | 'mount'`

  If specified, a request with method `head` will be executed in the background when the user hovers over the link, or when the link is first mounted.

  Use this to improve performance by eagerly loading lazy routes.

- `replace` - *optional* - `boolean`

  Specifies that instead of pushing a new entry onto the browser history, the link should replace the existing entry.

- `state` - *optional* - `object`

  Specifies a state object to associate with the browser history entry.
  
  In requests produced by clicking the link, this `state` will be available at `request.state`.

#### Examples

By spreading the result of `useLink()`, you can use buttons from popular frameworks like Material UI as links.

```tsx
import Button from '@material-ui/core/Button'
import { useLink } from 'react-routing-library'

export function ButtonLink({ href, onClick, onMouseEnter, ...restProps }) {
  const linkProps = useLink(href, {
    onClick,
    onMouseEnter,
  })

  return (
    <Button {...linkProps} {...restProps} />
  )
}
```


### `useNavigation()`

```tsx
const { block, navigate, prefetch, ...other } = useNavigation()
```

Returns a [`RouterNavigation`](#routernavigation) object, which you can use to prefetch routes, block navigation, and perform programmatic navigation.


### `usePendingRequest()`

```tsx
const pendingRequest = usePendingRequest()
```

If a navigation action maps to a request with asynchronous content that has started loading but not yet been rendered, this will return the [`RouterRequest`](#routerrequest) object associated with action. Otherwise, it'll return `null`.

#### Examples

This hook is useful for rendering an app-wide loading bar at the top of your page.

```tsx
function App() {
  return (
    <RoutingProvider router={appRouter}>
      <AppRouteLoadingIndicator />
      <AppLayout>
        <Suspense fallback={<Spinner />}>
          <RouterContent />
        </Suspense>
      </AppLayout>
    </RoutingProvider>
  )
}

function AppRouteLoadingIndicator() {
  const pendingRequest = usePendingRequest()
  return pendingRequest && <div className="AppRouteLoadingIndicator" />
}
```

### `useRequest()`

```tsx
const request = useRequest()
```

Returns the [`RouterRequest`](#routerrequest) object associated with the current route.


## Router helpers

### `createAsyncRouter()`

```tsx

```

### `createLazyRouter()`

```tsx

```

### `createPatternRouter()`

```tsx

```

### `createRedirectRouter()`

```tsx

```


## Functions

### `createHref()`

```tsx

```

### `getRoute()`

```tsx

```

### `parseHref()`

```tsx

```


## Error handling

### `NotFoundError`

```tsx

```

### `notFoundRouter`

```tsx

```


## Types

RRL is built with TypeScript. It exports the following types for public use.

### `GetRouteOptions`

```tsx

```

### `Route`

```tsx

```

### `Router`

```tsx

```

### `RouterDelta`

```tsx

```

### `RouterNavigation`

```tsx

```

### `RouterRequest`

```tsx

```

### `RouterResponse`

```tsx

```

### `UseLinkOptions`

```tsx

```