const mime = require('mime-types')
const crypto = require('crypto')
module.exports = (ctx) => {
  const pluginConfig = ctx => {
    let config = ctx.getConfig('picgo-plugin-oss-custom-headers')
    if (!config) {
      config = {}
    }
    return [{
      name: 'headers',
      type: 'input',
      alias: 'headers',
      default: config.headers || '',
      message: '如Cache-Control: max-age:31536000',
      required: false
    }
    ]
  }
  const generateSignature = (options, fileName) => {
    const date = new Date().toUTCString()
    const mimeType = mime.lookup(fileName)
    if (!mimeType) throw Error(`No mime type found for file ${fileName}`)

    const signString = `PUT\n\n${mimeType}\n${date}\n/${options.bucket}/${options.path}${fileName}`

    const signature = crypto.createHmac('sha1', options.accessKeySecret).update(signString).digest('base64')
    return `OSS ${options.accessKeyId}:${signature}`
  }

  const postOptions = (options, fileName, signature, image) => {
    return {
      method: 'PUT',
      url: `https://${options.bucket}.${options.area}.aliyuncs.com/${encodeURI(options.path)}${encodeURIComponent(fileName)}`,
      headers: {
        Host: `${options.bucket}.${options.area}.aliyuncs.com`,
        Authorization: signature,
        Date: new Date().toUTCString(),
        'Content-Type': mime.lookup(fileName)
      },
      body: image,
      resolveWithFullResponse: true
    }
  }
  const register = () => {
    ctx.helper.uploader.register('oss-custom-headers', {
      async handle (ctx) {
        const aliYunOptions = ctx.getConfig('picBed.aliyun')
        let pluginConfig = ctx.getConfig('picgo-plugin-oss-custom-headers')
        if (!pluginConfig) {
          pluginConfig = null
        }
        if (!aliYunOptions) {
          throw new Error('Can\'t find aliYun OSS config')
        }
        try {
          const imgList = ctx.output
          const customUrl = aliYunOptions.customUrl
          const path = aliYunOptions.path
          for (const img of imgList) {
            if (img.fileName && img.buffer) {
              const signature = generateSignature(aliYunOptions, img.fileName)
              let image = img.buffer
              if (!image && img.base64Image) {
                image = Buffer.from(img.base64Image, 'base64')
              }
              const options = postOptions(aliYunOptions, img.fileName, signature, image)
              const validHeaders = ['Cache-Control', 'Expires']
              try {
                // throw new Error('你好')
                if (pluginConfig) {
                  const headers = pluginConfig.headers ? pluginConfig.headers.split(';') : []
                  headers.forEach(header => {
                    // ' Expires: Thu, 20 Dec 2023 16:57:08 GMT' can't split by ':'
                    const [k, v] = header.split(/:(.*)/)
                    if (validHeaders.includes(k.trim())) { options.headers[k.trim()] = v.trim() }
                  })
                }
              } catch (err) {
                ctx.emit('notification', {
                  title: 'oss-custom-headers parse error',
                  body: err.toString(),
                  text: ''
                })
              }
              const body = await ctx.request(options)
              if (body.statusCode === 200) {
                delete img.base64Image
                delete img.buffer
                const optionUrl = aliYunOptions.options || ''
                if (customUrl) {
                  img.imgUrl = `${customUrl}/${encodeURI(path)}${encodeURIComponent(img.fileName)}${optionUrl}`
                } else {
                  img.imgUrl = `https://${aliYunOptions.bucket}.${aliYunOptions.area}.aliyuncs.com/${encodeURI(path)}${encodeURIComponent(img.fileName)}${optionUrl}`
                }
              } else {
                throw new Error('Upload failed')
              }
            }
          }
          return ctx
        } catch (err) {
          ctx.emit('notification', {
            title: ctx.i18n.translate('UPLOAD_FAILED'),
            body: ctx.i18n.translate('CHECK_SETTINGS')
          })
          throw err
        }
      }
    })
    ctx.helper.beforeUploadPlugins.register('oss-custom-headers', {
      handle (ctx) {
        const type = ctx.getConfig('picBed.uploader') || ctx.getConfig('picBed.current')
        ctx.emit('notification', {
          title: 'oss-custom-headers test',
          body: type || 'null',
          text: ''
        })
        if (type === 'aliyun') {
          ctx.setConfig({
            picBed: {
              ...ctx.getConfig('picBed'),
              current: 'oss-custom-headers',
              uploader: 'oss-custom-headers'

            }
          })
        }
      }
    })
  }
  return {
    uploader: 'oss-custom-headers',
    register,
    config: pluginConfig
  }
}
