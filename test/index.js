const path = require('path')
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
})
const { PicGo } = require('picgo')
const ossCustomPlugin = require('../src/index')
const picgo = new PicGo() // 将使用默认的配置文件：~/.picgo/config.json
picgo.setConfig({
  picBed: {
    current: 'aliyun',
    uploader: 'aliyun',
    aliyun: {
      accessKeyId: process.env.accessKeyId,
      accessKeySecret: process.env.accessKeySecret,
      /** 存储空间名 */
      bucket: process.env.bucket,
      /** 存储区域代号 */
      area: process.env.area,
      /** 自定义存储路径 */
      path: process.env.path,
      /** 自定义域名，注意要加 `http://` 或者 `https://` */
      customUrl: process.env.customUrl || '',
      /** 针对图片的一些后缀处理参数 PicGo 2.2.0+ PicGo-Core 1.4.0+ */
      options: process.env.options || ''

    }
  }
})
picgo.use(ossCustomPlugin, 'picgo-plugin-oss-custom-headers')
picgo.setConfig({
  'picgo-plugin-oss-custom-headers': {
    headers: 'Cache-Control: max-age=31536000; Expires: Thu, 20 Dec 2023 16:57:08 GMT'
  }
})

// 上传具体路径下的图片
picgo.upload([path.resolve(__dirname, './picgo.png')]).then(res => console.log(res))
