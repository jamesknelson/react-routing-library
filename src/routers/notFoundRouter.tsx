import * as React from 'react'

import { RouterFunction, RouterRequest } from '../core'

export class NotFoundError {
  constructor(readonly request: RouterRequest) {}
}

export interface NotFoundProps {
  error: NotFoundError
}

export const NotFound: React.SFC<NotFoundProps> = (props) => {
  throw props.error
}

export const notFoundRouter: RouterFunction = (request, response) => {
  const error = new NotFoundError(request)

  response.error = error
  response.status = 404

  return <NotFound error={error} />
}
