import * as React from 'react'
import { ReactNode } from 'react'

import { RouterFunction, RouterRequest, RouterResponse } from '../core'
import { isPromiseLike } from '../utils'

import { memoizeRouter } from './memoizeRouter'
import { provideRouterRequest } from './provideRouterRequest'

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
  getKeys?: (request: Request) => any[],
): RouterFunction<Request, Response> {
  return memoizeRouter(
    provideRouterRequest((request, response) => {
      const promisedContent = asyncRouter(request, response)

      if (!isPromiseLike(promisedContent)) {
        return promisedContent
      }

      const resultRef: ResultRef = {
        current: null,
      }

      promisedContent
        .then((value) => {
          if (response.pending === promisedContent) {
            delete response.pending
          }

          resultRef.current = {
            type: 'value',
            value,
          }
        })
        .then(undefined, (error) => {
          if (response.pending === promisedContent) {
            delete response.pending
          }

          resultRef.current = {
            type: 'error',
            error,
          }

          response.error = error
          response.status = 500

          // TODO: find a way to invalidate the memoizer cache if an async
          //       transformer fails.
          console.error(
            'An async router failed with the following error:',
            error,
          )

          throw error
        })

      response.pending = promisedContent

      return (
        <AsyncContentWrapper
          promisedContent={promisedContent}
          resultRef={resultRef}
        />
      )
    }),
    getKeys,
  )
}
