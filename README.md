# 介绍

单纯对 ali-oss 的 new 进行封装,所有属性方法都会变成 Promise（方法本来就是 Promise

# 用法

```安装
npm i -S proxy-ali-oss

yarn add proxy-ali-oss
```

```js
import { createProxyOSS } from "proxy-ali-oss";
/**
 * options: 参考new OSS(options)
 * uploadHttp: 需要提供getSTS方法，并且返回accessKeyId，accessKeySecret。stsToken
 * interceptors?: 拦截
 * */
const oss = createProxyClient(
  {
    bucket: "bucket",
    ...options,
  },
  uploadHttp,
  {
    then(data) {
      return Promise.resolve(data);
    },
    catch(data) {
      return Promise.resolve(data);
    },
  }
);
```
