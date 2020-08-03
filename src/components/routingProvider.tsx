import * as React from 'react'

import { RouterContentContext, RouterProvider } from '../context'
import { Router, RouterRequest, RouterState, RouterResponse } from '../core'
import { UseRouterOptions, useRouter } from '../hooks/useRouter'

import { Content } from './content'

export interface RoutingProviderProps<
  S extends RouterState = RouterState,
  Response extends RouterResponse = RouterResponse
> extends UseRouterOptions<S, Response> {
  children?: React.ReactNode
  router: Router<RouterRequest<S>, Response>
}

export function RoutingProvider<
  S extends RouterState = RouterState,
  Response extends RouterResponse = RouterResponse
>({ children, router, ...rest }: RoutingProviderProps<S, Response>) {
  const [output, navigation] = useRouter(router, { ...rest })
  const content = output.content.props.children as React.ReactNode
  return (
    <RouterProvider
      navigation={navigation}
      request={output.request}
      pendingRequest={output.pendingRequest}>
      <RouterContentContext.Provider value={content}>
        {children === undefined ? <Content /> : children}
      </RouterContentContext.Provider>
    </RouterProvider>
  )
}
