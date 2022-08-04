import { test, expect } from 'vitest'
import { transformSync } from '@babel/core'
import functionBuriedPoint, { testSourceCode } from '../src/function-tracker.js'

test('test function tracker', () => {
  const { code } = transformSync(testSourceCode, {
    plugins: [[functionBuriedPoint, { path: 'tracker' }]],
    parserOpts: {
      sourceType: 'unambiguous',
      plugins: []
    }
  })

  expect(code).toMatchInlineSnapshot(`
    "import _tracker2 from \\"tracker\\";
    import aa from 'aa';
    import * as bb from 'bb';
    import { cc } from 'cc';
    import 'dd';

    function a() {
      _tracker2();

      console.log('aaa');
    }

    class B {
      bb() {
        _tracker2();

        return 'bbb';
      }

    }

    const c = () => {
      _tracker2();

      return 'ccc';
    };

    const d = function foo() {
      _tracker2();

      console.log('ddd');
    };"
  `)
})
