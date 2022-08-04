import { declare } from '@babel/helper-plugin-utils'

export default declare((api, options) => {
  function errorHandle(handle) {
    const temp = Error.stackTraceLimit
    Error.stackTraceLimit = 0
    handle()
    Error.stackTraceLimit = temp
  }

  return {
    pre(file) {
      file.set('errors', [])
    },

    visitor: {
      ForStatement(path, state) {
        const testOperator = path.node.test.operator
        const updateOperator = path.node.update.operator

        let correctUpdateOperator
        if (['<', '<='].includes(testOperator)) correctUpdateOperator = '++'

        if (['>', '>='].includes(testOperator)) correctUpdateOperator = '--'

        if (correctUpdateOperator !== updateOperator) {
          errorHandle(() =>
            state.file
              .get('errors')
              .push(
                path.get('update').buildCodeFrameError('for direction error')
              )
          )
        }
      },

      AssignmentExpression(path, state) {
        const assignTarget = path.get('left').toString()
        const bounding = path.scope.getBinding(assignTarget)

        if (
          bounding &&
          (bounding.path.isFunctionDeclaration() ||
            bounding.path.isFunctionExpression())
        ) {
          errorHandle(() =>
            state.file
              .get('errors')
              .push(path.buildCodeFrameError('can not reassign to function'))
          )
        }
      },

      BinaryExpression(path, state) {
        const left = path.get('left')
        const right = path.get('right')

        if (
          left.isLiteral() &&
          right.isLiteral() &&
					['!=', '=='].includes(path.node.operator) &&
          typeof left.node.value !== typeof right.node.value
        ) {
          errorHandle(() =>
            state.file
              .get('errors')
              .push(path.buildCodeFrameError('Unused more rigorous judgment'))
          )

					if (options.fix) {
						path.node.operator = path.node.operator + '='
					}
        }
      }
    },

    post(file) {
      file.get('errors').forEach(error => {
        console.log(error)
      })
    }
  }
})
