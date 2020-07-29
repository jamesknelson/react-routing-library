import * as React from 'react'

import { useNavigation } from '../hooks/useNavigation'

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode
  href: string
}

export function Link(props: LinkProps) {
  const { children, href, ...rest } = props

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

    navigate(href)
  }

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
}
