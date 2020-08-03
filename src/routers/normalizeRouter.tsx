import { Router, RouterRequest, RouterResponse } from '../core'
import { normalizePathname, parseDelta } from '../utils'

import { createRedirectRouter } from './createRedirectRouter'

export function normalizeRouter<
  Request extends RouterRequest,
  Response extends RouterResponse
>(router: Router<Request, Response>): Router<Request, Response> {
  return (request: Request, response: Response) => {
    let pathname = normalizePathname(request.pathname)

    if (pathname === '/' || pathname === '') {
      pathname = '/'
    } else {
      pathname = pathname[0] !== '/' ? '/' + pathname : pathname
      pathname =
        pathname[pathname.length - 1] === '/'
          ? pathname.slice(0, pathname.length - 1)
          : pathname
    }

    if (pathname !== request.pathname) {
      return createRedirectRouter(parseDelta({ ...request, pathname }), 301)(
        request,
        response,
      )
    }
    return router(request, response)
  }
}
