import {
  MatchFunction,
  match as createMatchFunction,
  parse as parsePattern,
} from 'path-to-regexp'
import * as React from 'react'

import { Router, RouterRequest, RouterResponse } from '../core'
import { normalizePathname } from '../utils'

import { createRouter } from './createRouter'
import { notFoundRouter } from './notFoundRouter'

export interface CreatePatternRouterOptions<
  Request extends RouterRequest,
  Response extends RouterResponse
> {
  [pattern: string]: React.ReactNode | Router<Request, Response>
}

export function createPatternRouter<
  Request extends RouterRequest,
  Response extends RouterResponse
>(
  handlers: CreatePatternRouterOptions<Request, Response>,
): Router<Request, Response> {
  const tests: {
    matchFunction: MatchFunction
    pattern: string
    router: Router<Request, Response>
    wildcardParamName?: string
  }[] = []

  const patterns = Object.keys(handlers)
  for (const rawPattern of patterns) {
    const handler = handlers[rawPattern]
    const router = createRouter(
      typeof handler === 'function'
        ? (handler as Router<Request, Response>)
        : () => <>{handler}</>,
    )

    let pattern = normalizePathname(rawPattern.replace(/^\.?\/?/, '/'))

    if (pattern.slice(pattern.length - 2) === '/*') {
      pattern = pattern.slice(0, pattern.length - 2) + '/(.*)?'
    } else if (pattern.slice(pattern.length - 1) === '*') {
      pattern = pattern.slice(0, pattern.length - 1) + '/(.*)?'
    } else if (pattern === '/*') {
      pattern = '/(.*)?'
    }

    const lastToken = parsePattern(pattern).pop()
    tests.push({
      matchFunction: createMatchFunction(pattern, {
        encode: encodeURI,
        decode: decodeURIComponent,
      }),
      pattern,
      router,
      wildcardParamName:
        lastToken && typeof lastToken !== 'string' && lastToken.pattern === '.*'
          ? String(lastToken.name)
          : undefined,
    })
  }

  return (request, response) => {
    const { basename, pathname } = request
    const unmatchedPathname =
      (pathname.slice(0, basename.length) === basename
        ? pathname.slice(basename.length)
        : pathname) || '/'

    for (const test of tests) {
      const match = test.matchFunction(unmatchedPathname)
      if (match) {
        const params = match.params as any
        let wildcard = ''
        if (test.wildcardParamName) {
          wildcard = params[test.wildcardParamName] || ''
          delete params[test.wildcardParamName]
        }
        return test.router(
          {
            ...request,
            basename: pathname.slice(0, pathname.length - wildcard.length),
            params: { ...request, ...params },
          },
          response,
        )
      }
    }

    return notFoundRouter(request, response)
  }
}
