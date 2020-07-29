import { useContext } from 'react'

import { RouterRequestContext } from '../context'
import { RouterRequest, RouterState } from '../core'

export function useRequest<
  State extends RouterState = RouterState
>(): RouterRequest<State> {
  return useContext(RouterRequestContext) as RouterRequest<State>
}
