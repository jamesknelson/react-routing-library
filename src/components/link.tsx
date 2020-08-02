import * as React from 'react'

import { useNavigation } from '../hooks/useNavigation'

export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  children: React.ReactNode
  to: string
}

export function Link(props: LinkProps) {
  const { children, to, ...rest } = props

  const { navigate } = useNavigation()

  const handleClick = (event: React.MouseEvent) => {
    // Don't hijack navigation when a modifier is being pressed,
    // e.g. to open the link in a new tab
    if (
      event.button !== 0 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return
    }

    event.preventDefault()

    navigate(to)
  }

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
}
