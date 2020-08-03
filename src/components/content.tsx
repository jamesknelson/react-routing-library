import * as React from 'react'
import { useContext } from 'react'

import { RouterContentContext } from '../context'

export const Content: React.SFC = () => {
  return <>{useContext(RouterContentContext)}</>
}
