import { it, expect } from 'vitest'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { transformFileSync } from '@babel/core'
import codeCompression from '../src/code-compression'

const __dirname = dirname(fileURLToPath(import.meta.url))

it('test', () => {
  const { code } = transformFileSync(join(__dirname, '../mock/code.js'), {
    plugins: [codeCompression],
    generatorOpts: {
      // compact: true, // 去除空格
      comments: false // 移除注释
    }
  })
  expect(code).toMatchInlineSnapshot(`
    "function _g() {
      const _c = 1;
      const _d = 2;

      _f(3, 4);

      console.log(_d);
      return _d;

      function _f(_a, _b) {
        return _a + _b;
      }
    }

    _g();"
  `)
})
