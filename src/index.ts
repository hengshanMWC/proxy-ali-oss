const OSS = require("ali-oss");
// const OSS = require("ali-oss/dist/aliyun-oss-sdk.min.js");
import { createProxy, createDefinePropertyProxy } from "./proxy";

const createProxyType =
  typeof Proxy !== "undefined" ? createProxy : createDefinePropertyProxy;

export function createProxyOSS(
  options: object,
  http: HttpSTS,
  interceptors?: Interceptors
) {
  return createProxyType(createProxyFunction(http, options, interceptors));
}

function createProxyFunction(
  http: HttpSTS,
  options: object,
  interceptors: Interceptors = {}
) {
  let client: any = null;
  let p: Promise<any> | null = null; // 缓存起来，防止多次触发
  function init() {
    if (!p) {
      p = http.getSTS();
    }
    return p
      .then(
        (data) =>
          (client = new OSS({
            refreshSTSToken() {
              return http.getSTS();
            },
            refreshSTSTokenInterval: 600000, // 目前是15分钟过期，这里设置成10分钟国旗
            ...options,
            ...data,
          }))
      )
      .catch((err) => Promise.reject(err))
      .finally(() => (p = null));
  }
  function handler(
    data: any,
    fn: (value: unknown) => void,
    cdType: keyof Interceptors
  ) {
    if (typeof interceptors[cdType] === "function") {
      (interceptors[cdType] as Function)(data).then((data: any) => fn(data));
    } else {
      fn(data);
    }
  }
  return (key: any) => {
    return function (...params: any[]) {
      return new Promise((resolve, reject) => {
        // 函数和非函数的不同操作，defineProperty模式下，目前都是函数
        function emitClient() {
          if (typeof client[key] === "function") {
            client[key](...params)
              .then((data: any) => handler(data, resolve, "then"))
              .catch((err: any) => handler(err, reject, "catch"));
          } else {
            handler(client[key], resolve, "then");
          }
        }
        if (client) {
          emitClient();
        } else {
          init()
            .then(() => emitClient())
            .catch((err) => reject(err));
        }
      });
    };
  };
}
