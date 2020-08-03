import { History, createMemoryHistory } from 'history'
import { ReactElement, ReactNode } from 'react'
import { ParsedUrlQuery, parse as parseQuery } from 'querystring'

import { parseLocation, waitForMutablePromiseList } from './utils'

import { normalizeRouter } from './routers/normalizeRouter'

export type Router<
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

  hash: string

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

  /**
   * Allows a router to indicate that the content may not yet have been
   * committed to the DOM, and this if interaction with the DOM is required,
   * the router should wait until these promises are resolved.
   *
   * Note that this array can be mutated, so once the known promises are
   * resolved, you should always check if any more promises have been added.
   */
  pendingCommits: PromiseLike<any>[]

  /**
   * Allows a router to indicate that the content will currently suspend,
   * and if it is undesirable to render suspending content, the router should
   * wait until there are no more pending promises.
   *
   * Note that this array can be mutated, so once the known promises are
   * resolved, you should always check if any more promises have been added.
   */
  pendingSuspenses: PromiseLike<any>[]

  // can be used to specify redirects, not found, etc.
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

export interface GetRouteOptions<S extends RouterState> {
  actionType?: RouterActionType
  basename?: string
  followRedirects?: boolean
  history?: History<S>
  maxRedirects?: number
  method?: string
  normalizePathname?: boolean
}

export async function getRoute<
  S extends RouterState = RouterState,
  Response extends RouterResponse = RouterResponse
>(
  router: Router<RouterRequest<S>, Response>,
  location: string | RouterDelta<S>,
  options: GetRouteOptions<S> = {},
): Promise<Route<S, Response>> {
  const generator = generateSyncRoutes(router, parseLocation(location), options)

  let route: Route<S, Response>
  while (1) {
    const item = generator.next()
    if (item.done) break
    route = item.value
    await waitForMutablePromiseList(route.response.pendingSuspenses)
  }
  return route!
}

export function* generateSyncRoutes<
  S extends RouterState = RouterState,
  Response extends RouterResponse = RouterResponse
>(
  _router: Router<RouterRequest<S>, Response>,
  location: RouterLocation<S>,
  options: GetRouteOptions<S>,
): Generator<Route<S, Response>> {
  const {
    actionType = 'pop',
    basename = '',
    followRedirects = false,
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
    (followRedirects &&
      response.status &&
      response.status >= 300 &&
      response.status < 400)
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
      }
    }

    response = ({
      head: [],
      headers: {},
      pendingCommits: [],
      pendingSuspenses: [],
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
