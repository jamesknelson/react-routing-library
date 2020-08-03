import { Router, RouterRequest, RouterResponse } from '../core'

import { createAsyncRouter } from './createAsyncRouter'

export function createLazyRouter<
  Request extends RouterRequest,
  Response extends RouterResponse
>(
  load: () => PromiseLike<{ default: Router<Request, Response> }>,
): Router<Request, Response> {
  let router: Router<Request, Response> | undefined

  return createAsyncRouter(async (request, response) => {
    if (!router) {
      router = (await load()).default
    }
    return router(request, response)
  })
}
