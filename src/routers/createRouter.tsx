import * as React from 'react'
import { useEffect } from 'react'

import { RouterRequestContext } from '../context'
import { Router, RouterRequest, RouterResponse } from '../core'
import { Deferred } from '../utils'

export function createRouter<
  Request extends RouterRequest,
  Response extends RouterResponse
>(router: Router<Request, Response>): Router<Request, Response> {
  return (request, response) => {
    const content = router(request, response)
    const contentPendingDeferred = new Deferred<void>()

    response.pendingCommits.push(contentPendingDeferred.promise)

    return (
      <RouterContentWrapper
        content={content}
        deferred={contentPendingDeferred}
        request={request}
      />
    )
  }
}

interface RouterContentWrapperProps {
  content: React.ReactNode
  deferred: Deferred<void>
  request: RouterRequest
}

function RouterContentWrapper({
  content,
  deferred,
  request,
}: RouterContentWrapperProps) {
  useEffect(() => {
    deferred.resolve()
  }, [deferred])

  return (
    <RouterRequestContext.Provider value={request}>
      {content}
    </RouterRequestContext.Provider>
  )
}
