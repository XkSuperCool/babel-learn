import { transformFileSync } from '@babel/core'
// import autoTranslate from './src/auto-translate.js'
// import autoApiDocs from './src/auto-api-docs.js'
// import lint from './src/lint.js'
import typeChecker from './src/type-checker.js'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const { code } = transformFileSync(join(__dirname, './mock/type-checker.txt'), {
  plugins: [
    [
      typeChecker,
      {
        outputDir: join(__dirname, './test'),
        fix: true
      }
    ]
  ],
  parserOpts: {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'typescript']
  }
})

console.log(code)