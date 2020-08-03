<h1 align="center">
  React Routing Library
</h1>

<h4 align="center">
  Simple, powerful routing that grows with your app.
</h4>

<p align="center">
  <a href="https://www.npmjs.com/package/react-routing-library"><img alt="NPM" src="https://img.shields.io/npm/v/react-routing-library.svg"></a>
</p>


## Getting Started

```bash
yarn add react-routing-library
```

- [**Read the 2-minute primer**](#2-minute-primer)
<!-- - Why React Routing Library? *(coming soon*)* -->
<!-- - [View the guided examples &raquo;](./examples) -->
- [View the API reference &raquo;](./docs/api.md)
<!-- - Try a Real-world example on CodeSandbox &raquo; *(coming soon)* -->


## 2-minute primer

**Your router just is a function.**

With React Routing Library, a **router** is a function that maps a request to an element.

```ts
type Router = (request: RouterRequest) => ReactNode
```

You've seen this before -- its a lot like a React component.

```tsx
const router = request => {
  switch (request.pathname) {
    case '/':
      return <h1>Home</h1>

    case '/about':
      return <h1>About</h1>

    default:
      throw new Error('Not Found')
  }
}
```

Once you have a router, just pass it to a `<RoutingProvider>`. Then, use a `<Content />` element to indicate where you want your content to be rendered.

```tsx
import { Content, RoutingProvider } from 'react-routing-library'

export default function App() {
  return (
    <RoutingProvider router={router}>
      <Content />
    </RoutingProvider>
  )
}
```

Routers-as-functions is the underlying secret that makes RRL so powerful. Most of the time though, it's easier to let RRL create router functions for you. For example, the above router could be created with `createPatternRouter()`.

```tsx
import { createPatternRouter } from 'react-routing-library'

const router = createPatternRouter({
  '/': <h1>Home</h1>,
  '/about': <h1>About</h1>
})
```

Naturally, your `<Content>` element can be nested anywhere inside the routing provider. This lets you easily add layout elements, for example a site-wide navigation bar. And hey presto -- you've now built a simple app with push-state routing!

[*View this example live at CodeSandbox &raquo;*](https://codesandbox.io/s/rrl-minimal-vsdsd)

```tsx
import { Link } from 'react-routing-library'

function AppLayout({ children }) {
  return (
    <>
      <header>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </header>
      <main>
        {children}
      </main>
    </>
  )
}

export default function App() {
  return (
    <RoutingProvider router={router}>
      <AppLayout>
        <Content />
      </AppLayout>
    </RoutingProvider>
  )
}
```

<!--

TODO

## Examples and guides

- [Minimal live example]()
- [Full real-world live example]()

--- 

- [Route parameters guide]()
- [Not found boundaries guide](./examples/not-found-boundary)
- [Redirects guide]()
- [Nested routers guide]()
- [Nested layouts guide]()
- [Concurrent mode guide]()
- [Pre-caching data guide]()
- [Loading indicators guide]()
- [Animated transitions guide]()
- [Authentication guide]()
- [SSR guide]()

-->


## API

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

- [`Route`](/docs/api.md#route)
- [`Router`](/docs/api.md#router)
- [`RouterDelta`](/docs/api.md#routerdelta)
- [`RouterNavigation`](/docs/api.md#routernavigation)
- [`RouterRequest`](/docs/api.md#routerrequest)
- [`RouterResponse`](/docs/api.md#routerresponse)


## License

MIT License, Copyright &copy; 2020 James K. Nelson
