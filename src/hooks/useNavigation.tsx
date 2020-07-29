import { useContext } from 'react'

import { RouterNavigationContext } from '../context'
import { RouterNavigation, RouterResponse, RouterState } from '../core'

export function useNavigation<
  State extends RouterState = RouterState,
  Response extends RouterResponse = RouterResponse
>(): RouterNavigation<State, Response> {
  return useContext(RouterNavigationContext) as RouterNavigation<
    State,
    Response
  >
}
