export interface RouterCache {
  clear(): void
  bucket<Key extends object = any, Value = any>(
    key: any,
  ): RouterCacheBucket<Key, Value>
}

export interface RouterCacheBucket<Key extends object = any, Value = any> {
  has(key: Key): boolean
  get(key: Key): Value | undefined
  set(key: Key, value: Value): void
}

export const createRouterCache = (): RouterCache => {
  const buckets = new Map<any, WeakMap<any, any>>()
  const bucket = (key: any) => {
    let map = buckets.get(key)
    if (!map) {
      map = new WeakMap()
      buckets.set(key, map)
    }
    return map
  }
  const clear = () => buckets.clear()
  return { bucket, clear }
}
