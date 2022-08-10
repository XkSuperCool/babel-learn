import { declare } from '@babel/helper-plugin-utils'

export default declare((api, options) => {
  api.assertVersion(7)

  const base54 = (function () {
    var DIGITS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_'
    return function (num) {
      var ret = ''
      do {
        ret = DIGITS.charAt(num % 54) + ret
        num = Math.floor(num / 54)
      } while (num > 0)
      return ret
    }
  })()

  return {
    pre(file) {
      file.set('uid', 0)
    },

    visitor: {
      Scopable: {
        enter(path) {
          Object.entries(path.scope.bindings).forEach(([key, binding]) => {
            if (binding.referenced) return

            if (binding.path.get('init').isCallExpression()) {
              const comments = binding.path.get('init').node.leadingComments

              if (comments && comments[0].value === '@__PURE__') {
                // 纯函数直接删除
                binding.path.remove()
              } else if (!path.scope.isPure(binding.path.node.init)) {
                // 无法确定是否是纯函数时，只保留函数调用
                binding.path.parentPath.replaceWith(
                  api.types.expressionStatement(binding.path.get('init').node)
                )
              }
							return
            }

            binding.path.remove()
          })
        },

        exit(path, state) {
          Object.entries(path.scope.bindings).forEach(([key, binding]) => {
            if (binding.mangled) return

            binding.mangled = true
            let uid = state.file.get('uid')
            binding.path.scope.rename(
              key,
              binding.scope.generateUid(base54(uid++))
            )
            state.file.set('uid', uid)
          })
        }
      },

      BlockStatement(path) {
        const body = path.get('body')

        let purge = false
        for (let i = 0; i < body.length; i++) {
          const curPath = body[i]

          if (curPath.isCompletionStatement()) {
            purge = true
            continue
          }

          if (
            purge &&
            !(
              curPath.isFunctionDeclaration() ||
              curPath.isVariableDeclaration({ kind: 'var' })
            )
          ) {
            curPath.remove()
          }
        }
      }
    }
  }
})
