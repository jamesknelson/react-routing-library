import * as React from 'react'
import { ReactNode } from 'react'

import { Router, RouterRequest, RouterResponse } from '../core'
import { isPromiseLike } from '../utils'

import { createRouter } from './createRouter'

interface ResultRef {
  current:
    | null
    | {
        type: 'error'
        error: any
      }
    | {
        type: 'value'
        value: ReactNode
      }
}

export interface AsyncResponseContentProps {
  promisedContent: PromiseLike<ReactNode>
  resultRef: ResultRef
}

export const AsyncContentWrapper: React.SFC<AsyncResponseContentProps> = ({
  promisedContent,
  resultRef,
}) => {
  const result = resultRef.current
  if (!result) {
    throw promisedContent
  } else if (result.type === 'error') {
    throw result.error
  }
  return <>{result.value}</>
}

export function createAsyncRouter<
  Request extends RouterRequest,
  Response extends RouterResponse
>(
  asyncRouter: (request: Request, response: Response) => PromiseLike<ReactNode>,
): Router<Request, Response> {
  return createRouter<Request, Response>((request, response) => {
    const promisedContent = asyncRouter(request, response)

    if (!isPromiseLike(promisedContent)) {
      return promisedContent
    }

    const resultRef: ResultRef = {
      current: null,
    }

    promisedContent
      .then((value) => {
        resultRef.current = {
          type: 'value',
          value,
        }
      })
      .then(undefined, (error) => {
        resultRef.current = {
          type: 'error',
          error,
        }

        response.error = error
        response.status = 500

        console.error('An async router failed with the following error:', error)

        throw error
      })

    response.pendingSuspenses.push(promisedContent)

    return (
      <AsyncContentWrapper
        promisedContent={promisedContent}
        resultRef={resultRef}
      />
    )
  })
}
