import { test, expect } from 'vitest'
import { transformSync } from '@babel/core'
import autoTranslate from '../src/auto-translate.js'

test('test auto translate', () => {
	const sourceCode = `
	`

  const { code } = transformSync(sourceCode, {
    plugins: [autoTranslate]
  })

  expect(code).toMatchInlineSnapshot()
})
