import { RouterDelta, RouterState } from '../core'
import { getDelta, normalizePathname } from '../utils'

import { useRequest } from './useRequest'

/**
 * Returns a boolean that indicates whether the user is currently
 * viewing the specified href.
 * @param href
 * @param options.exact If false, will match any URL underneath this href
 * @param options.loading If true, will match even if the route is currently loading
 */
export const useIsActive = <S extends RouterState = RouterState>(
  href: string | RouterDelta<S>,
  {
    exact = true,
  }: {
    /**
     * If false, will return true even if viewing a child of this route.
     */
    exact?: boolean
  } = {},
) => {
  const request = useRequest()
  const delta = getDelta(href, request)

  return (
    delta &&
    (!delta.pathname ||
      (exact
        ? normalizePathname(delta.pathname) === request.pathname
        : request.pathname.indexOf(normalizePathname(delta.pathname)) === 0))
  )
}
