import { useCallback, useEffect, useMemo } from 'react'

import { RouterDelta, RouterState, createHref } from '../core'
import { getDelta } from '../utils'

import { useNavigation } from './useNavigation'
import { useRequest } from './useRequest'

export interface UseLinkOptions {
  disabled?: boolean
  replace?: boolean
  prefetch?: 'hover' | 'mount'
  state?: object
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
  onMouseEnter?: React.MouseEventHandler<HTMLAnchorElement>
}

export const useLink = <S extends RouterState = RouterState>(
  to: string | RouterDelta<S>,
  options: UseLinkOptions,
) => {
  const { disabled, prefetch, replace, state, onClick, onMouseEnter } = options
  const navigation = useNavigation()
  const request = useRequest()
  const delta = getDelta(to, request, state)

  // Memoize the delta so we don't create new handler callbacks on every
  // render. This is important for this component, as its not unusual for there
  // to be hundreds of links on a page.
  const deps = [delta?.pathname, delta?.search, delta?.hash, delta?.state]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedDelta = useMemo(() => delta, deps)

  const doPrefetch = useMemo(() => {
    let hasPrefetched = false

    return () => {
      if (!hasPrefetched && memoizedDelta && navigation) {
        hasPrefetched = true
        navigation.prefetch(memoizedDelta).catch((e) => {
          console.warn(
            `A routing link tried to prefetch "${
              memoizedDelta!.pathname
            }", but the router was unable to fetch this path.`,
          )
        })
      }
    }
  }, [memoizedDelta, navigation])

  // Prefetch on mount if required, or if `prefetch` becomes `true`.
  useEffect(() => {
    if (prefetch === 'mount') {
      doPrefetch()
    }
  }, [prefetch, doPrefetch])

  let handleMouseEnter = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (prefetch === 'hover') {
        if (onMouseEnter) {
          onMouseEnter(event)
        }

        if (disabled) {
          event.preventDefault()
          return
        }

        if (!event.defaultPrevented) {
          doPrefetch()
        }
      }
    },
    [disabled, doPrefetch, onMouseEnter, prefetch],
  )

  let handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      // Let the browser handle the event directly if:
      // - The user used the middle/right mouse button
      // - The user was holding a modifier key
      // - A `target` property is set (which may cause the browser to open the
      //   link in another tab)
      if (
        event.button === 0 &&
        !(event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      ) {
        if (disabled) {
          event.preventDefault()
          return
        }

        if (onClick) {
          onClick(event)
        }

        if (!event.defaultPrevented && memoizedDelta) {
          event.preventDefault()
          navigation.navigate(memoizedDelta, { replace })
        }
      }
    },
    [disabled, memoizedDelta, navigation, onClick, replace],
  )

  return {
    onClick: handleClick,
    onMouseEnter: handleMouseEnter,
    href: delta ? createHref(delta) : (to as string),
  }
}
