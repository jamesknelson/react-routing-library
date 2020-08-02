import * as React from 'react'
import { createContext } from 'react'

import { RouterNavigation, RouterRequest } from './core'

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
