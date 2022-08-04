import { declare } from '@babel/helper-plugin-utils'

export default declare((api, options) => {
  function resolveType(typeAnnotation) {
    switch (typeAnnotation.type) {
      case 'TSStringKeyword':
        return 'string'
      case 'StringTypeAnnotation':
        return 'string'
      case 'TSNumberKeyword':
        return 'number'
      case 'NumberTypeAnnotation':
        return 'number'
      case 'TSBooleanKeyword':
        return 'boolean'
      case 'TSTypeReference':
        return typeAnnotation.typeName.name
      default:
        return typeAnnotation
    }
  }

  function handleError(file, getError) {
    const temp = Error.stackTraceLimit
    Error.stackTraceLimit = 0
    file.get('errors').push(getError())
    Error.stackTraceLimit = temp
  }

  return {
    pre(file) {
      file.set('errors', [])
    },

    visitor: {
      AssignmentExpression(path, state) {
        const leftBinding = path.scope.getBinding(path.get('left'))
        const leftType = resolveType(
          leftBinding.path.get('id').getTypeAnnotation()
        )
        const rightType = resolveType(path.get('right').getTypeAnnotation())

        if (leftType !== rightType)
          handleError(state.file, () => path.buildCodeFrameError('type error'))
      },

      CallExpression(path, state) {
        const func = path.scope.getBinding(path.get('callee'))
        const paramsType = func.path.get('params').map(item => {
          return resolveType(item.getTypeAnnotation())
        })
        const argumentsType = path
          .get('arguments')
          .map(item => resolveType(item.getTypeAnnotation()))

        argumentsType.forEach((type, index) => {
          if (type !== paramsType[index])
            handleError(state.file, () =>
              path
                .get('arguments')
                [index].buildCodeFrameError('function params type error')
            )
        })
      }
    },

    post(file) {
      file.get('errors').forEach(i => {
        console.log(i)
      })
    }
  }
})
