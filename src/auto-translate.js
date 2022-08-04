import { declare } from '@babel/helper-plugin-utils'
import generate from '@babel/generator'
import fse from 'fs-extra'
import path from 'path'

export default declare((api, options) => {
  api.assertVersion(7)

  let key = 0
  function getIntlKey() {
    return `intl${key++}`
  }

  function getReplaceExpression(path, key, intlUid) {
    const params = path.isTemplateLiteral()
      ? path.node.expressions.map(item => generate.default(item).code)
      : []

		let expression = api.template.ast(
      `${intlUid}.t(${key}${params.length > 0 ? ',' + params.join(',') : ''})`
    ).expression

    // jsx 处理: <div title='hello' /> -> <div title={intl.t('intl0')}/>
    if (
      path.findParent(parent => parent.isJSXAttribute()) &&
      !path.findParent(parent => parent.isJSXExpressionContainer())
		)
      expression = api.types.jSXExpressionContainer(expression)

    return expression
  }

  function save(file, key, value) {
    const allText = file.get('allText')
    allText.push([key, value])
    file.set('allText', allText)
  }

  return {
    pre(file) {
      file.set('allText', [])
    },

    visitor: {
      Program: {
        enter(path, state) {
          let imported = false

          path.traverse({
            ImportDeclaration(curPath) {
              const sourcePath = curPath.get('source').node.value
              if (sourcePath === 'intl') {
                imported = true
                state.intlUid = curPath
                  .get('specifiers.0')
                  .get('local')
                  .toString()
                curPath.stop()
              }
            }
          })

          if (!imported) {
            state.intlUid = path.scope.generateUid('intl')
            const intlAST = api.template.ast(
              `import ${state.intlUid} from 'intl'`
            )
            path.node.body.unshift(intlAST)
          }

          path.traverse({
            'TemplateLiteral|StringLiteral'(path) {
              const leadingComments = path.node.leadingComments

              if (leadingComments) {
                // 移出 intl-disabled 注释, 并标识需要跳过转换的字面量
                path.node.leadingComments = leadingComments.filter(comment => {
                  if (comment.value.includes('intl-disabled')) {
                    path.node.skipTransform = true
                    return false
                  }

                  return true
                })
              }

              // import xx from 'xx' -> 模块引入的字面量也需要跳过
              if (path.findParent(parent => parent.isImportDeclaration()))
                path.node.skipTransform = true
            }
          })
        }
      },

      StringLiteral(path, state) {
        if (path.node.skipTransform) return
                
        const key = getIntlKey()
        save(state.file, key, path.node.value)
        const expression = getReplaceExpression(path, key, state.intlUid)
        path.replaceWith(expression)
        path.skip()
      },

      TemplateLiteral(path, state) {
        if (path.node.skipTransform) return

        const value = path
          .get('quasis')
          .map(item => item.node.value.raw)
          .join('{placeholder}')

				if (value) {
					const key = getIntlKey()
          save(state.file, key, value)
					const expression = getReplaceExpression(path, key, state.intlUid)
					path.replaceWith(expression)
					path.skip()
				}
      }
    },

    post(file) {
      const allText = file.get('allText')
      const data = allText.reduce((obj, [key, value]) => {
        obj[key] = value
        return obj
      }, {})
      const content = `export default ${JSON.stringify(data, null, 4)}`
      
      // 判断文件夹是否存在
      fse.ensureDirSync(options.outputDir)
      // 写入文件
      fse.writeFileSync(path.join(options.outputDir, 'zh_CN.js'), content)
      fse.writeFileSync(path.join(options.outputDir, 'en_US.js'), content)
    }
  }
})
