import { useContext } from 'react'

import { RouterPendingRequestContext } from '../context'
import { RouterRequest, RouterState } from '../core'

export function usePendingRequest<
  State extends RouterState = RouterState
>(): null | RouterRequest<State> {
  return useContext(RouterPendingRequestContext) as RouterRequest<State> | null
}
