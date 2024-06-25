## picgo-plugin-oss-custom-headers

A plugin for picgo to custom oss put headers

picgo 客户端不支持设置阿里云 OSS 图片上传的元信息(请求头 headers), 使用阿里云 OSS 做图床的用户需要手动到 OSS 控制台给`bucket`里的图片设置缓存头, 本插件仅支持给阿里云 OSS 图床添加缓存 Headers.

**在 picgo 客户端搜索插件**:

<img width="540px" src="https://raw.githubusercontent.com/lunode/picgo-plugin-oss-custom-headers/master/img/search.png" alt="插件设置"/>

**安装之后新增 uploader, 取消勾选, 隐藏 uploader**:
由于 picgo 没有暴露修改内部 uploader 的方法, 所以依照源码重写了`aliyun`的内部`uploader`, 虽然这个新 uploader 并不是插件想要实现的功能, 但 picgo 也没有提供隐藏的方式, 我们取消勾选, 隐藏这个 uploader, 将功能交给`plugin`

<img width="540px" src="https://raw.githubusercontent.com/lunode/picgo-plugin-oss-custom-headers/master/img/hide.png" alt="插件设置"/>

**点击插件设置 Headers**:

<img width="540px" src="https://raw.githubusercontent.com/lunode/picgo-plugin-oss-custom-headers/master/img/set.png" alt="插件设置"/>

**设置缓存 Headers**:

```txt
Cache-Control: max-age=31536000; Expires: Thu, 20 Dec 2023 16:57:08 GMT
```

请求头之间使用分号`;`隔开, 类似`k:v;k:v`
阿里云 OSS 可以自定义的用户元信息(headers)只有几个, 经我使用体验, 只有`Cache-Control`和`Expires`是有用的, 所以 headers 设置目前只支持这两个请求头, 参考[阿里云文档](https://help.aliyun.com/zh/oss/user-guide/manage-object-metadata-10)

<img width="540px" src="https://raw.githubusercontent.com/lunode/picgo-plugin-oss-custom-headers/master/img/content.png" alt="设置缓存Headers"/>

推荐缓存头设置, 缓存一年:

```
Cache-Control: max-age=31536000;
```

设置完成后, 上传到 OSS 的图片就添加了`HTTP`缓存头元信息.

## 在 Node.js 中使用插件

```js
const { PicGo } = require("picgo");
const ossCustomPlugin = require("picgo-plugin-oss-custom-headers");
// register plugin
picgo.use(ossCustomPlugin, "picgo-plugin-oss-custom-headers");
// set plugin config
picgo.setConfig({
  "picgo-plugin-oss-custom-headers": {
    headers:
      "Cache-Control: max-age=31536000; Expires: Thu, 20 Dec 2023 16:57:08 GMT",
  },
});
```

## Debug

如何调试插件:

需要在`.env`文件添加关于 aliyun 的配置, 具体字段和`picgo`软件中`阿里云OSS`的配置一致

```sh
accessKeyId=
accessKeySecret=
bucket=
area=
path=
customUrl=
option=
```

配置好.env 后,执行`npm run test`即可调试
