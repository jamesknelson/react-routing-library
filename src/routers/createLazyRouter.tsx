import { RouterFunction, RouterRequest, RouterResponse } from '../core'

import { createAsyncRouter } from './createAsyncRouter'

export function createLazyRouter<
  Request extends RouterRequest,
  Response extends RouterResponse
>(
  load: () => PromiseLike<{ default: RouterFunction<Request, Response> }>,
): RouterFunction<Request, Response> {
  let router: RouterFunction<Request, Response> | undefined

  return createAsyncRouter(async (request, response) => {
    if (!router) {
      router = (await load()).default
    }
    return router(request, response)
  })
}
