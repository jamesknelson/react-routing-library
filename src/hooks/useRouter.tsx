/* eslint-disable react-hooks/rules-of-hooks */
/// <reference types="react/experimental" />

import { History, createBrowserHistory } from 'history'
import * as React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { RouterProvider } from '../context'
import {
  Route,
  Router,
  RouterActionType,
  RouterDelta,
  RouterLocation,
  RouterNavigation,
  RouterState,
  RouterRequest,
  RouterResponse,
  generateSyncRoutes,
  getRoute,
} from '../core'
import { Deferred, parseDelta, waitForMutablePromiseList } from '../utils'

const DefaultTransitionTimeoutMs = 3000

export interface UseRouterOptions<
  State extends RouterState = RouterState,
  Response extends RouterResponse = RouterResponse
> {
  basename?: string

  /**
   * If provided, this will be used until an effect is able to be run. This
   * is useful for SSR.
   */
  initialRoute?: Route<State, Response>

  locationReducer?: RouterLocationReducer<State>

  /**
   * Called when a complete response object becomes available.
   */
  onResponseComplete?: (
    response: Response,
    request: RouterRequest<State>,
  ) => void

  transitionTimeoutMs?: number

  unstable_concurrentMode?: boolean

  window?: Window
}

export type RouterLocationReducer<S extends RouterState = RouterState> =
  // This returns a partial request, as a key and cache still need to be added
  // by the router itself.
  (location: RouterLocation<S>, action: RouterDelta<S>) => RouterLocation<S>

export interface UseRouterOutput<State extends RouterState = RouterState> {
  /**
   * In concurrent mode, this will return the latest content -- and if the
   * current route is pending, it'll return the pending content.
   *
   * In legacy mode, it'll contain the most recent non-pending content.
   */
  content: React.ReactElement

  /**
   * If the browser location has changed but the request isn't ready to render
   * yet, the pending request will be available here.
   */
  pendingRequest: RouterRequest<State> | null

  /**
   * Contains the currently rendered request. Initially, this will contain
   * the initial request. In concurrent mode, the two trees will contain
   * different values for this.
   */
  request: RouterRequest<State>
}

export function useRouter<
  S extends RouterState = RouterState,
  Response extends RouterResponse = RouterResponse
>(
  router: Router<RouterRequest<S>, Response>,
  options: UseRouterOptions<S, Response> = {},
): readonly [UseRouterOutput<S>, RouterNavigation<S, Response>] {
  const {
    basename = '',
    initialRoute,
    onResponseComplete,
    locationReducer = defaultLocationReducer as RouterLocationReducer<S>,
    transitionTimeoutMs = DefaultTransitionTimeoutMs,
    unstable_concurrentMode,
    window,
  } = options

  const deferredsRef = useRef<Deferred<void>[]>([])
  const act = useCallback((fn: () => void) => {
    const deferred = new Deferred<void>()
    deferredsRef.current.push(deferred)
    if (historyRef.current) {
      fn()
    }
    return deferred.promise
  }, [])

  const onResponseCompleteRef = useRef(onResponseComplete)
  const historyRef = useRef<History<S>>()
  if (!historyRef.current && !initialRoute) {
    historyRef.current = getBrowserHistory(window) as History<S>
  }

  const [route, setRoute] = useState<Route<S, Response>>(() => {
    if (initialRoute) {
      return initialRoute
    } else {
      const history = historyRef.current!
      return Array.from(
        generateSyncRoutes(router, history.location, {
          basename,
          followRedirects: true,
          history,
        }),
      ).pop()!
    }
  })

  let transitionRoute: (route: Route<S, Response>) => void
  if (unstable_concurrentMode) {
    const transitionOptions = useMemo(
      () => ({ timeoutMs: transitionTimeoutMs }),
      [transitionTimeoutMs],
    )
    const [startTransition] = React.unstable_useTransition(transitionOptions)
    transitionRoute = useCallback(
      (route: Route<S, Response>) =>
        startTransition(() => {
          setRoute(route)
        }),
      [startTransition],
    )
  } else {
    const transitionCountRef = useRef(0)
    transitionRoute = useCallback(
      (route: Route<S, Response>) => {
        if (
          transitionTimeoutMs === 0 ||
          !route.response.pendingSuspenses.length
        ) {
          setRoute(route)
        } else {
          // Force a refresh to pick up our transitioning request
          setRoute((state) => ({ ...state }))

          const transitionCount = ++transitionCountRef.current

          Promise.race([
            waitForMutablePromiseList(route.response.pendingSuspenses),
            new Promise((resolve) => setTimeout(resolve, transitionTimeoutMs)),
          ]).then(() => {
            if (transitionCount === transitionCountRef.current) {
              setRoute(route)
            }
          })
        }
      },
      [transitionTimeoutMs],
    )
    useEffect(() => {
      return () => {
        transitionCountRef.current += 1
      }
    }, [])
  }

  const transitioningRequestRef = useRef<RouterRequest<S> | null>(null)
  const transition = useCallback(
    (
      actionType: RouterActionType,
      method: string,
      getNextLocation: (location: RouterLocation<S>) => RouterLocation<S>,
    ): Promise<void> =>
      act(() => {
        const history = historyRef.current!
        const location = getNextLocation(history.location)
        const route = Array.from(
          generateSyncRoutes(router, location, {
            actionType,
            basename,
            followRedirects: true,
            history,
            method,
          }),
        ).pop()
        if (route) {
          transitioningRequestRef.current = route.request
          transitionRoute(route)
        }
      }),
    [act, basename, router, transitionRoute],
  )

  // Store the base request for the prefetch action in a ref, and update it in
  // the update hook, so that the navigation object doesn't change between
  // requests.
  const baseRequestForPrefetchRef = useRef(route.request)

  const navigation = useMemo<RouterNavigation<S, Response>>(
    () => ({
      back: (): Promise<void> => act(() => historyRef.current?.back()),
      block: (blocker) => {
        if (historyRef.current) {
          return historyRef.current.block(({ location, retry }) => {
            blocker(retry, location)
          })
        } else {
          return () => {}
        }
      },
      prefetch: async (
        action,
        { method = 'HEAD' } = {},
      ): Promise<Route<S, Response>> => {
        const currentRequest = baseRequestForPrefetchRef.current
        const location = locationReducer(currentRequest, parseDelta(action))
        return await getRoute(router, location, {
          basename,
          method,
        })
      },
      navigate: (
        delta,
        { method = 'GET', replace = false } = {},
      ): Promise<void> =>
        transition(replace ? 'replace' : 'push', method, (location) =>
          locationReducer(location, parseDelta(delta)),
        ),
      reload: (): Promise<void> => {
        return transition('replace', 'GET', (location) => location)
      },
    }),
    [act, basename, locationReducer, transition, router],
  )

  const initialNavigationRef = useRef(navigation)
  useEffect(() => {
    // If the router, basename, cache, or other settings change, we'll want
    // to recompute the current route.
    if (navigation !== initialNavigationRef.current) {
      navigation.reload()
    }
  }, [navigation])

  useEffect(() => {
    const browserHistory = getBrowserHistory(window) as History<S>
    historyRef.current = browserHistory
    return browserHistory.listen(({ action, location }) => {
      if (action === 'POP') {
        transition('pop', 'GET', () => location)
      }
    })
  }, [transition, window])

  useEffect(() => {
    let unmounted = false

    const { request, response } = route

    baseRequestForPrefetchRef.current = request

    // Resolve any promises returned by navigation methods
    const deferreds = deferredsRef.current.slice()
    deferredsRef.current = []
    for (const deferred of deferreds) {
      deferred.resolve()
    }

    if (transitioningRequestRef.current === route.request) {
      transitioningRequestRef.current = null
    }

    async function handleResponse() {
      await waitForMutablePromiseList(response.pendingSuspenses)

      if (!unmounted && (response.status || 200) < 300) {
        if (onResponseCompleteRef.current) {
          onResponseCompleteRef.current(response, request)
        }
      }
    }

    handleResponse()

    return () => {
      unmounted = true
    }
  }, [route])

  const pendingRequest =
    route.request === transitioningRequestRef.current
      ? null
      : transitioningRequestRef.current
  const wrappedState = useMemo(
    () => ({
      content: (
        <RouterProvider
          children={route.content}
          navigation={navigation}
          request={route.request}
          pendingRequest={pendingRequest}
        />
      ),
      pendingRequest,
      request: route.request,
    }),
    [navigation, pendingRequest, route],
  )

  return [wrappedState, navigation] as const
}

export function defaultLocationReducer<S extends RouterState = RouterState>(
  location: RouterLocation<S>,
  delta: RouterDelta<S>,
): RouterLocation<S> {
  return {
    hash: delta.hash || '',
    pathname: delta.pathname || location.pathname,
    search: delta.search || '',
    state: delta.state || ({} as S),
  }
}

const getBrowserHistory: {
  (window?: Window): History
  history?: History
  window?: Window
} = (window?) => {
  if (!getBrowserHistory.history || getBrowserHistory.window !== window) {
    getBrowserHistory.history = createBrowserHistory({ window })
    getBrowserHistory.window = window
  }
  return getBrowserHistory.history
}
