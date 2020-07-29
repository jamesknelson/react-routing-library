import * as React from 'react'

import { RouterContentContext, RouterProvider } from '../context'
import {
  RouterFunction,
  RouterRequest,
  RouterState,
  RouterResponse,
} from '../core'
import { UseRouterOptions, useRouter } from '../hooks/useRouter'

import { RouterContent } from './routerContent'

export interface RouterOptions<
  S extends RouterState = RouterState,
  Response extends RouterResponse = RouterResponse
> extends UseRouterOptions<S, Response> {
  children?: React.ReactNode
  router: RouterFunction<RouterRequest<S>, Response>
}

export function Router<
  S extends RouterState = RouterState,
  Response extends RouterResponse = RouterResponse
>({ children, router, ...rest }: RouterOptions<S, Response>) {
  const [output, navigation] = useRouter(router, { ...rest })
  const content = output.content.props.children as React.ReactNode
  return (
    <RouterProvider
      navigation={navigation}
      request={output.request}
      pendingRequest={output.pendingRequest}>
      <RouterContentContext.Provider value={content}>
        {children === undefined ? <RouterContent /> : children}
      </RouterContentContext.Provider>
    </RouterProvider>
  )
}
