import { History, createMemoryHistory, parsePath } from 'history'
import { ReactElement, ReactNode } from 'react'
import {
  ParsedUrlQuery,
  parse as parseQuery,
  stringify as stringifyQuery,
} from 'querystring'

import { RouterCache, createRouterCache } from './cache'

import { normalizeRouter } from './routers/normalizeRouter'

export type RouterFunction<
  Request extends RouterRequest = RouterRequest,
  Response extends RouterResponse = RouterResponse
> = (request: Request, response: Response) => ReactNode

export interface RouterNavigation<
  S extends RouterState = RouterState,
  Response extends RouterResponse = RouterResponse
> {
  back(): Promise<void>

  block(blocker: RouterBlocker<S>): () => void

  navigate(
    delta: string | RouterDelta<S>,
    options?: {
      method?: string
      replace?: boolean
    },
  ): Promise<void>

  /**
   * Allows you to fetch a route response without actually rendering it.
   */
  prefetch(
    delta: RouterDelta<S>,
    options?: {
      method?: string
    },
  ): Promise<Route<S, Response>>

  /**
   * Clones the existing request, updating its `key` to a new unique value.
   */
  reload(): Promise<void>
}

export type RouterBlocker<S extends RouterState = RouterState> = (
  retry: () => void,
  location: RouterLocation<S>,
) => void

export interface RouterLocation<S extends RouterState = RouterState> {
  hash: string
  pathname: string
  search: string
  state: S
}

export interface RouterDelta<S extends RouterState = RouterState> {
  hash?: string
  pathname?: string
  query?: ParsedUrlQuery
  search?: string
  state?: S
}

export type RouterActionType = 'push' | 'replace' | 'pop'

export type RouterState = object

export interface RouterRequest<S extends RouterState = RouterState> {
  /**
   * Contains the parts of the url that are not meand to be matched on,
   * either because they've been matched by a previous router or because the
   * app is mounted on a subdirectory.
   */
  basename: string

  /**
   * On the client, this will always be identical unless manually overridden.
   * On the server, this will by default be unique to specific request.
   */
  cache: RouterCache

  hash: string

  /**
   * A unique string that allows the developer to distinguish between different
   * requests where all other parameters are identical.
   *
   * When navigating forward and backward within history, this will keep its
   * value except in the case where the user navigates back to a location with
   * a non-GET method, in which case the key stored in history will be replaced
   * immediately after route finishes loading.
   */
  key: string

  method: string

  params: { [name: string]: string | string[] }

  pathname: string

  query: ParsedUrlQuery

  search: string

  state: S
}

export interface RouterResponse {
  content?: never

  error?: any

  head: ReactElement[]

  // when redirecting, the redirect location is stored on the `Location` key
  headers: { [name: string]: string }

  // allows a planned `routeLazy` component to tell the router that there's
  // more content on the way
  pending?: PromiseLike<any>

  // can be used to specify redirects, not found, etc.
  // for pending, use a 202 status
  status?: number
}

export interface Route<
  S extends RouterState = RouterState,
  Response extends RouterResponse = RouterResponse
> {
  content: ReactNode
  request: RouterRequest<S>
  response: Response
}

export interface GetRouteOptions<
  S extends RouterState,
  Response extends RouterResponse = RouterResponse
> {
  actionType?: RouterActionType
  basename?: string
  cache?: RouterCache
  history?: History<S>
  maxRedirects?: number
  method?: string
  normalizePathname?: boolean
}

export async function getRoute<
  S extends RouterState = RouterState,
  Response extends RouterResponse = RouterResponse
>(
  router: RouterFunction<RouterRequest<S>, Response>,
  location: string | RouterDelta<S>,
  options: GetRouteOptions<S, Response> = {},
): Promise<Route<S, Response>> {
  const generator = generateSyncRoutes(router, parseLocation(location), options)

  let route: Route<S, Response>
  while (1) {
    const item = generator.next()
    if (item.done) break
    route = item.value
    if (route.response.pending) {
      await route.response.pending
      delete route.response.pending
    }
  }
  return route!
}

export function* generateSyncRoutes<
  S extends RouterState = RouterState,
  Response extends RouterResponse = RouterResponse
>(
  _router: RouterFunction<RouterRequest<S>, Response>,
  location: RouterLocation<S>,
  options: GetRouteOptions<S, Response>,
): Generator<Route<S, Response>> {
  const {
    actionType = 'pop',
    basename = '',
    cache = createRouterCache(),
    history = createMemoryHistory(),
    maxRedirects = 5,
    method = 'GET',
    normalizePathname = true,
  } = options

  const router = normalizePathname ? normalizeRouter(_router) : _router
  const key =
    actionType === 'pop'
      ? history.location.key
      : tryToNavigateAndGetKey(history, location, actionType)

  if (!key) {
    return
  }

  // If not a GET method, immediate replace the state with the same
  // same so that the key will change, so the "back" button will
  // in a request with a different key (as the method will be
  // changed to GET)
  if (method !== 'GET') {
    history.replace(location, location.state)
  }

  let request: RouterRequest<S> = {
    basename,
    cache,
    key,
    method,
    params: {},
    query: parseQuery(location.search),
    ...location,
  }
  let content: ReactNode
  let redirectCounter = 0
  let response: Response | undefined

  while (
    !response ||
    (response.status && response.status >= 300 && response.status < 400)
  ) {
    if (response) {
      if (++redirectCounter > maxRedirects) {
        throw new Error('Possible redirect loop detected')
      }

      const redirectTo =
        response.headers?.Location || response.headers?.location

      if (redirectTo === undefined) {
        throw new Error('Redirect responses require a "Location" header')
      }

      const key = tryToNavigateAndGetKey(history, location, 'replace')
      if (!key) {
        return
      }

      request = {
        ...request,
        ...parseLocation(redirectTo),
        key,
      }
    }

    response = ({
      head: [],
      headers: {},
    } as any) as Response

    content = router(request, response)

    yield {
      content,
      response,
      request,
    }
  }
}

function tryToNavigateAndGetKey(
  history: History<any>,
  location: RouterLocation<any>,
  action: 'push' | 'replace',
): string | null {
  let wasTransitionAllowed = false
  const unlisten = history.listen(() => {
    wasTransitionAllowed = true
  })
  history[action](location, location.state)
  unlisten()
  return wasTransitionAllowed ? history.location.key : null
}

export function createHref(request: RouterDelta<any>): string {
  return (
    (request.pathname || '') + (request.search || '') + (request.hash || '')
  )
}

export function parseDelta<S extends RouterState = RouterState>(
  input: string | RouterDelta<S>,
): RouterDelta<S> {
  const delta: RouterDelta<S> =
    typeof input === 'string' ? parsePath(input) : { ...input }

  if (delta.search) {
    if (delta.query) {
      console.error(
        `A path was provided with both "search" and "query" parameters. Ignoring "search" in favor of "query".`,
      )
    } else {
      delta.query = parseQuery(delta.search.slice(1))
    }
  } else if (delta.query) {
    delta.search = stringifyQuery(delta.query)
  }

  return delta
}

export function parseLocation<S extends RouterState = RouterState>(
  input: string | RouterDelta<S>,
): RouterLocation<S> {
  return {
    hash: '',
    pathname: '',
    search: '',
    state: {} as S,
    ...parseDelta(input),
  }
}
