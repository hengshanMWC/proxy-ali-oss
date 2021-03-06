const rollup = require('rollup')
const fs = require('fs')
const path = require('path')
const zlib = require('zlib') // 用于使用gzip算法进行文件压缩
const terser = require('terser') // 用于Javascript代码压缩和美化
const validateNpmPackageName = require('validate-npm-package-name') // 判断是否合法的npm包
const camelcase = require('camelcase') // 转驼峰拼写
const typescript  = require("rollup-plugin-typescript2")
const tscompile  = require("typescript")
let { name }  = require('../package.json')
let moduleName = name
// 检查是否是合法的 npm 包名
if (!validateNpmPackageName(moduleName)) {
  throw new Error(`${moduleName} 不是一个合法的 npm 包名`)
}

// 对于 npm 私有包，取 @scope 后面的部分作为包名
if (/^@.+\//g.test(moduleName)) {
  moduleName = moduleName.split('/')[1]
}

// 将其他形式的命名规则转换为驼峰命名
moduleName = camelcase(moduleName)


// 头信息
const banner = '// * Released under the MIT License.\n'

// rollup 配置
const builds = {
  'es': {
    entry: 'src/index.ts',
    // 当文件名包含 .min 时将会自动启用 terser 进行压缩
    dest: `dist/${moduleName}.esm.min.js`,
    /* rollup 支持 5 种打包类型
      - amd   amd 规范
      - cjs   CommonJS 规范
      - es    es 规范
      - iife  立即执行函数
      - umd   umd 规范
    */
    format: 'es'
  },
  'cjs': {
    entry: 'src/index.ts',
    // 当文件名包含 .min 时将会自动启用 terser 进行压缩
    dest: `dist/${moduleName}.cjs.min.js`,
    format: 'cjs'
  }
}



const genConfig  = key => {
  const {entry, dest, format, plugins = [], external = [], name} = builds[key]
  const config = {
    input: entry,
    output: {
      file: dest,
      format,
      banner,
      name: name || moduleName,
    },
    plugins: [
      typescript({
        typescript: tscompile,
      }),
    ].concat(plugins),
    external: [].concat(external),
    // 监听
    watch: {
      include: 'src/**',
    }
  }
  useTsconfigDeclarationDir = false
  return config
}


// 以下代码取自 vue 官方仓库
// 通过 rollup api 打包所有 builds 中的配置
const getAllBuilds = Object.keys(builds).map(genConfig)

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist')
}


build(getAllBuilds)

function build (builds) {
  let built = 0
  const total = builds.length
  const next = () => {
    buildEntry(builds[built]).then(() => {
      built++
      if (built < total) {
        next()
      }
    }).catch(logError)
  }
  next()
}


function buildEntry (config) {
  const output = config.output
  const { file, banner } = output
  const isProd = /(min|prod)\.js$/.test(file)
  return rollup.rollup(config)
    .then(bundle => bundle.generate(output))
    .then((code) => {
      if (isProd) {
        const minified = (banner ? banner + '\n' : '') + terser.minify(code.output[0].code, {
          toplevel: true,
          output: {
            ascii_only: true
          },
          compress: {
            pure_funcs: ['makeMap']
          }
        }).code
        return write(file, minified, true)
      } else {
        return write(file, code.output[0].code)
      }
    })
}



function write (dest, code, zip) {
  return new Promise((resolve, reject) => {
    function report (extra) {
      console.log(blue(path.relative(process.cwd(), dest)) + ' ' + getSize(code) + (extra || ''))
      resolve()
    }

    fs.writeFile(dest, code, err => {
      if (err) return reject(err)
      if (zip) {
        zlib.gzip(code, (err, zipped) => {
          if (err) return reject(err)
          report(' (gzipped: ' + getSize(zipped) + ')')
        })
      } else {
        report()
      }
    })
  })
}

function getSize (code) {
  return (code.length / 1024).toFixed(2) + 'kb'
}

function logError (e) {
  console.log(e)
}

function blue (str) {
  return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m'
}
