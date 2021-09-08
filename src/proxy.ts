const OSS = require('ali-oss/dist/aliyun-oss-sdk.js')
export function createProxy(fn: Function) {
  return new Proxy(
    {},
    {
      get: function (target: any, propKey, receiver) {
        if (!target[propKey]) {
          target[propKey] = fn(propKey)
        }
        return Reflect.get(target, propKey, receiver)
      },
    },
  )
}
export function createDefinePropertyProxy(fn: Function) {
  const namesKey = Object.getOwnPropertyNames(OSS.prototype)
  const proxyObj = {}
  namesKey.forEach((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(
      OSS.prototype,
      key,
    ) as PropertyDescriptor
    let value: any
    descriptor.value = function (...params: any[]) {
      if (!value) {
        value = fn(key)
      }
      return value(...params)
    }
    Object.defineProperty(proxyObj, key, descriptor)
  })
  return proxyObj
}
