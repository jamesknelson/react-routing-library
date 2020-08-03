import { useContext } from 'react'

import { RouterContentContext } from '../context'

export const useContent = () => useContext(RouterContentContext)
