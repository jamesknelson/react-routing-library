import * as React from 'react'
import { useContext } from 'react'

import { RouterContentContext } from '../context'

export const RouterContent: React.SFC = () => {
  return <>{useContext(RouterContentContext)}</>
}
