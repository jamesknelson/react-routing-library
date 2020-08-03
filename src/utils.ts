import { RouterDelta, RouterRequest, RouterState, parseDelta } from './core'

export class Deferred<T> {
  promise: Promise<T>
  resolve!: (value: T) => void
  reject!: (error: any) => void

  constructor() {
    this.promise = new Promise((resolve: any, reject: any) => {
      this.resolve = resolve
      this.reject = reject
    })
    Object.freeze(this)
  }
}

export function getDelta<S extends RouterState = RouterState>(
  href: string | RouterDelta<S>,
  currentRequest?: RouterRequest<S>,
  state?: S,
): undefined | RouterDelta<S> {
  if (!isExternalHref(href)) {
    // Resolve relative to the current "directory"
    if (currentRequest && typeof href === 'string') {
      href =
        href[0] === '/' ? href : joinPaths('/', currentRequest.pathname, href)
    }
    return parseDelta(href, state)
  }
}

export function isExternalHref(href) {
  // If this is an external link, return undefined so that the native
  // response will be used.
  return (
    !href ||
    (typeof href === 'string' &&
      (href.indexOf('://') !== -1 || href.indexOf('mailto:') === 0))
  )
}

// users/789/, profile      => users/789/profile/
// /users/123, .           => /users/123
// /users/123, ..          => /users
// /users/123, ../..       => /
// /a/b/c/d,   ../../one   => /a/b/one
// /a/b/c/d,   .././one/    => /a/b/c/one/
export function joinPaths(base: string, ...paths: string[]): string {
  let allSegments = splitPath(base)
  for (let i = 0; i < paths.length; i++) {
    allSegments.push(...splitPath(paths[i]))
  }

  let pathSegments: string[] = []
  let lastSegmentIndex = allSegments.length - 1
  for (let i = 0; i <= lastSegmentIndex; i++) {
    let segment = allSegments[i]
    if (segment === '..') {
      pathSegments.pop()
    }
    // Allow empty segments on the first and final characters, so that leading
    // and trailing slashes will not be affected.
    else if (
      segment !== '.' &&
      (segment !== '' || i === 0 || i === lastSegmentIndex)
    ) {
      pathSegments.push(segment)
    }
  }

  return pathSegments.join('/')
}
function splitPath(path: string): string[] {
  if (path === '') {
    return []
  }
  return path.split('/')
}

export function isPromiseLike(x: any): x is PromiseLike<any> {
  return x && typeof x.then === 'function'
}

export function normalizePathname(pathname: string): string {
  return decodeURI(pathname).replace(/\/+/g, '/').replace(/\/$/, '').normalize()
}

export async function waitForMutablePromiseList(promises: PromiseLike<any>[]) {
  let count = 0
  while (count < promises.length) {
    await promises[count++]
  }
  promises.length = 0
}
