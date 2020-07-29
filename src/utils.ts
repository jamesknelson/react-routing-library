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

export function isPromiseLike(x: any): x is PromiseLike<any> {
  return x && typeof x.then === 'function'
}

export function normalizePathname(pathname: string): string {
  return decodeURI(pathname).replace(/\/+/g, '/').normalize()
}
