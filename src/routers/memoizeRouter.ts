import { ReactNode } from 'react'

import { RouterFunction, RouterResponse, RouterRequest } from '../core'

interface CacheItem {
  keys: any[]
  content: ReactNode
  response: RouterResponse
}

const MemoizeRouterBucket = Symbol('MemoizeRouterBucket')

/**
 * Takes a function that maps a request to an arbitrary return value, and
 * returns another router which only recomputes its response when the relevant
 * parts of the request change.
 */
export function memoizeRouter<
  Request extends RouterRequest,
  Response extends RouterResponse
>(
  router: RouterFunction<Request, Response>,
  getKeys?: (req: Request) => any[],
): RouterFunction<Request, Response> {
  if (!getKeys) {
    getKeys = (req) => [req.key]
  }

  return (request, response) => {
    const cacheBucket = request.cache.bucket<
      RouterFunction<Request, Response>,
      CacheItem
    >(MemoizeRouterBucket)
    const keys = getKeys!(request)
    const last = cacheBucket.get(router)
    if (
      last &&
      last.keys.length === keys.length &&
      last.keys.every((key, i) => keys[i] === key)
    ) {
      Object.assign(response, last.response)
      return last.content
    } else {
      const content = router(request, response)
      cacheBucket.set(router, { keys, content, response })
      return content
    }
  }
}
