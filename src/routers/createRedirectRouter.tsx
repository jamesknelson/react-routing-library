import * as React from 'react'

import { useNavigation } from '../hooks/useNavigation'
import { Router, RouterDelta, RouterRequest } from '../core'
import { createHref, parseDelta } from '../utils'

export interface RedirectProps {
  href: string
}

export const Redirect: React.SFC<RedirectProps> = (props) => {
  const controller = useNavigation()
  throw controller.navigate(props.href, { replace: true })
}

export function createRedirectRouter<
  Request extends RouterRequest = RouterRequest
>(
  to:
    | string
    | RouterDelta<any>
    | ((request: Request) => string | RouterDelta<any>),
  status = 302,
): Router<Request> {
  return (fromRequest, response) => {
    const toRequest = parseDelta(
      typeof to === 'function' ? to(fromRequest) : to,
    )
    const href = createHref(toRequest)

    response.headers.Location = href
    response.status = status

    return <Redirect href={href} />
  }
}
