import { RouterFunction, RouterRequest, RouterResponse } from '../core'

import { createAsyncRouter } from './createAsyncRouter'

export function createLazyRouter<
  Request extends RouterRequest,
  Response extends RouterResponse
>(
  load: () => PromiseLike<{ default: RouterFunction<Request, Response> }>,
): RouterFunction<Request, Response> {
  return createAsyncRouter(async (request, response) => {
    const { default: router } = await load()
    return router(request, response)
  })
}
