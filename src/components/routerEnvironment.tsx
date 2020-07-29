import * as React from 'react'
import { useMemo } from 'react'

import { RouterCache, createRouterCache } from '../cache'
import { RouterEnvironmentContext } from '../context'
import { Route } from '../core'

export interface RouterEnvironmentProps {
  cache?: RouterCache
  children: React.ReactNode
  initialRoute?: Route
}

export function RouterEnvironment(props: RouterEnvironmentProps) {
  const { cache, children, initialRoute } = props

  const context = useMemo(
    () => ({
      cache: cache || createRouterCache(),
      initialRoute,
    }),
    [cache, initialRoute],
  )

  return (
    <RouterEnvironmentContext.Provider value={context}>
      {children}
    </RouterEnvironmentContext.Provider>
  )
}
