import * as React from 'react'

import { RouterRequestContext } from '../context'
import { RouterFunction, RouterRequest, RouterResponse } from '../core'

export function provideRouterRequest<
  Request extends RouterRequest,
  Response extends RouterResponse
>(
  router: RouterFunction<Request, Response>,
): RouterFunction<Request, Response> {
  return (request, response) => {
    const content = router(request, response)
    return (
      <RouterRequestContext.Provider value={request}>
        {content}
      </RouterRequestContext.Provider>
    )
  }
}
