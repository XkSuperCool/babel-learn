import fse from 'fs-extra'
import path from 'path'
import { declare } from '@babel/helper-plugin-utils'
import { parse } from 'doctrine'

export default declare((api, options) => {
  function resolveType(typeAnnotation) {
    switch (typeAnnotation.type) {
      case 'TSStringKeyword':
        return 'string'
      case 'TSNumberKeyword':
        return 'number'
      case 'TSBooleanKeyword':
        return 'boolean'
      case 'TSTypeReference':
        return typeAnnotation.typeName.name
      default:
        return typeAnnotation
    }
  }

  function parserComment(comment) {
    return parse(comment, {
      unwrap: true
    })
  }

  return {
    pre(file) {
      file.set('docs', [])
    },

    visitor: {
      FunctionDeclaration(path, state) {
        let docs = state.file.get('docs')
        docs.push({
          type: 'function',
          name: path.get('id').toString(),
          params: path.get('params').map(paramPath => ({
            name: paramPath.toString(),
            type: resolveType(paramPath.getTypeAnnotation())
          })),
          returnType: resolveType(path.get('returnType').getTypeAnnotation()),
          docs: path.node.leadingComments
            ? parserComment(path.node.leadingComments[0].value)
            : '-'
        })
        state.file.set('docs', docs)
      },

      ClassDeclaration(path, state) {
        let docs = state.file.get('docs')
        const doc = {
          type: 'Class',
          name: path.get('id').toString(),
          property: [],
          methods: [],
          doc: path.node.leadingComments
            ? parserComment(path.node.leadingComments[0].value)
            : '-'
        }

        path.traverse({
          ClassMethod(curPath) {
            const content = {
              name: curPath.get('key').toString(),
              params: curPath.get('params').map(param => ({
                name: param.toString(),
                type: resolveType(param.getTypeAnnotation())
              })),
							returnType: resolveType(
								curPath.get('returnType').getTypeAnnotation()
							),
							doc: curPath.node.leadingComments
								? parserComment(curPath.node.leadingComments[0].value)
								: '-'
            }

            if (curPath.node.kind === 'constructor') {
              doc.constructor = content
            } else {
              doc.methods.push(content)
            }
          },

          ClassProperty(curPath) {
            doc.property.push({
              name: curPath.get('key').toString(),
              type: resolveType(curPath.getTypeAnnotation()),
              doc: [path.node.trailingComments, path.node.leadingComments]
                .filter(Boolean)
                .map(comment => {
                  return parserComment(comment[0].value)
                })
            })
          }
        })

        docs.push(doc)
        state.file.set('docs', docs)
      }
    },

    post(file) {
      const docs = file.get('docs')
      fse.ensureDirSync(options.outputDir)
      fse.writeFileSync(
        path.join(options.outputDir, 'test.json'),
        JSON.stringify(docs, null, 2)
      )
    }
  }
})
