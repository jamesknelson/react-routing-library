import * as React from 'react'
import { createContext } from 'react'

import { RouterCache, createRouterCache } from './cache'
import { Route, RouterNavigation, RouterRequest } from './core'

export interface RouterEnvironmentContext {
  cache: RouterCache
  initialRoute?: Route
}

// Export the default router context, so that it can be mutated by the
// application.
export const defaultRouterEnvironmentContext: RouterEnvironmentContext = {
  cache: createRouterCache(),
}

export const RouterEnvironmentContext = createContext(
  defaultRouterEnvironmentContext,
)

export const RouterContentContext = createContext<React.ReactNode>(
  undefined as any,
)

export const RouterNavigationContext = createContext<RouterNavigation>(
  undefined as any,
)

export const RouterPendingRequestContext = createContext<RouterRequest | null>(
  null,
)

export const RouterRequestContext = createContext<RouterRequest>(
  undefined as any,
)

export interface RouterProviderProps {
  children: React.ReactNode
  navigation: RouterNavigation
  request: RouterRequest
  pendingRequest: RouterRequest | null
}

export function RouterProvider(props: RouterProviderProps) {
  return (
    <RouterNavigationContext.Provider value={props.navigation}>
      <RouterRequestContext.Provider value={props.request}>
        <RouterPendingRequestContext.Provider value={props.pendingRequest}>
          {props.children}
        </RouterPendingRequestContext.Provider>
      </RouterRequestContext.Provider>
    </RouterNavigationContext.Provider>
  )
}
