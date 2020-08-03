
# API Reference

[**Components**](#components)

- [`<RoutingProvider>`](#routingprovider)
- [`<Content>`](#content)
- [`<Link>`](#link)
- [`<NotFoundBoundary>`](#notfoundboundary)

[**Hooks**](#hooks)

- [`useContent()`](#usecontent)
- [`useIsActive()`](#useisactive)
- [`useLink()`](#uselink)
- [`useNavigation()`](#usenavigation)
- [`usePendingRequest()`](#usependingrequest)
- [`useRequest()`](#userequest)

[**Router helpers**](#router-helpers)

- [`createAsyncRouter()`](#createasyncrouter)
- [`createLazyRouter()`](#createlazyrouter)
- [`createPatternRouter()`](#createpatternrouter)
- [`createRedirectRouter()`](#createredirectrouter)

[**Functions**](#functions)

- [`getRoute()`](#getroute)

&nbsp;

- [`createHref()`](#createhref)
- [`parseHref()`](#parsehref)

[**Error handling**](#error-handling)

- [`NotFoundError`](#notfounderror)
- [`notFoundRouter`](#notfoundrouter)

[**Types**](#types)

- [`Route`](#route)
- [`Router`](#router)
- [`RouterDelta`](#routerdelta)
- [`RouterRequest`](#routerrequest)
- [`RouterResponse`](#routerresponse)

&nbsp;

- [`GetRouteOptions`](#getrouteoptions)
- [`UseLinkOptions`](#uselinkoptions)


## Components

### `<RoutingProvider>`

This component goes at the top level of your app, configuring your app's routing and providing the routing context required by all other components and hooks.

#### Props

- `router` -- **required** -- `Router`

  A function that returns the content for each new location that the user navigates to.
  
  Typically, you'll use router helpers like `createPatternRouter()` to create this function.

- `basename` -- *optional* -- `string`

  If specified, this will be added to the `basename` property of each the router's requests -- ensuring that when this string appears at the beginning of the current URL, it'll be ignored by `createPatternRouter()` and other router helpers.

  Use this when you need to mount a RRL router under a subdirectory.

- `initialRoute` -- *optional* -- `Route`

  If provided with a `Route` object (as returned by the promise returned by `getRoute()`), this prop will be used as the current route until the first effect is able to be run.

  As effects will not run during server side rendering, this is useful for SSR. This can also be used to load asynchronous routes in legacy-mode React.
  
- `onResponseComplete` -- *optional* -- `(res: RouterResponse, req: RouterRequest) => void`

  If provided, this will be called with the final response object once a router has returned its final non-pending value.

  This is the only way to access the Response object outside of calling `getRoute()` directly, as response objects will not always be available on the initial render in concurrent mode due to partial hydration.

- `transitionTimeoutMs` -- *optional* -- `number`

  *Defaults to 3000ms.*

  This value specifies the amount of time that the router should wait for asynchronous and suspenseful content to load before going ahead and rendering an incomplete route anyway.

  If you'd like to always immediately render each new route, set this to 0. If you'd like to always wait until each route is fully loaded before rendering, set this to `Infinity`.

- `unstable_concurrentMode` -- *optional* -- `boolean`

  Set this to `true` to opt into using React's concurrent mode internally for transitions (i.e. `useTransition()`). Note, this feature will only work when using React's experimental branch, and when rendering your app with `createRoot()`.
  
  This should have no affect on the router's behavior itself, but may improve performance and allow you to use concurrent mode features like `<SuspenseList>` alongside routing components like `<Content>`.


#### Examples

TODO

### `<Content>`

Renders the current route's content, as returned by the `useContent()` hook.

This component will suspend if rendering lazy or async content that is still pending, and will throw an error if something goes wrong while loading your request's content.

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

#### Props

Accepts most props that the standard `<a>` does, along with:

- `to` -- **required** -- `string | RouterDelta`

  The address to which the link should navigate on click. Can be an `/absolute` string, a string `./relative` to the current route, or a *RouterDelta* object containing one or more of the keys `pathname`, `search`, `hash`, `query` or `state`.

- `active` -- *optional* -- `boolean`

  Specify this to override whether this link is considered active (when deciding whether to apply `activeClassName` and `activeStyles`).

- `activeClassName` -- *optional* -- `string`

  A CSS class to apply to the rendered `<a>` element when the user is currently viewing the `pathname` underneath that specified by the `to` prop.

- `activeStyle` -- *optional* -- `object`

  A CSS style object to apply to the rendered `<a>` element when the user is currently viewing a `pathname` underneath that specified by the `to` prop.

- `disabled` -- *optional* -- `boolean`

  If `true`, clicking the link will not result in any action being taken.

- `exact` -- *optional* -- `boolean`

  If `true`, `activeClassName` and `activeStyle` will only be displayed if viewing the exact pathname specified by `to` -- and not when viewing a descendent of it.

- `prefetch` -- *optional* -- `'hover' | 'mount'`

  If specified, a request with method `head` will be executed in the background when the user hovers over the link, or when the link is first mounted.

  Use this to improve performance by eagerly loading lazy routes.

- `replace` -- *optional* -- `boolean`

  Specifies that instead of pushing a new entry onto the browser history, the link should replace the existing entry.

- `state` -- *optional* -- `object`

  Specifies a state object to associate with the browser history entry.
  
  In requests produced by clicking the link, this `state` will be available at `request.state`.

#### Examples

```tsx
export function App() {
  return (
    <RoutingProvider router={appRouter}>
      <nav>
        <Link to="/" exact activeClassName="active" prefetch="hover">Home</Link>
        &nbsp;&middot;&nbsp;
        <Link to="/about" activeClassName="active" prefetch="hover">About</Link>
      </nav>
      <main>
        <Content />
      </main>
    </RoutingProvider>
  )
}
```

### `<NotFoundBoundary>`

Use this to catch any `NotFoundError` thrown your `<Content>` element, and render a user-friendly error message in its place.

#### Props

- `renderError` -- **required** -- `(error: NotFoundError) => ReactNode`

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
### `useIsActive()`
### `useLink()`
### `useNavigation()`
### `usePendingRequest()`
### `useRequest()`

## Router helpers

### `createAsyncRouter()`
### `createLazyRouter()`
### `createPatternRouter()`
### `createRedirectRouter()`

## Functions

### `getRoute()`

### `createHref()`
### `parseHref()`

## Error handling

### `NotFoundError`
### `notFoundRouter`

## Types

### `Route`
### `Router`
### `RouterDelta`
### `RouterRequest`
### `RouterResponse`

### `GetRouteOptions`
### `UseLinkOptions`