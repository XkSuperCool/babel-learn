import { declare } from '@babel/helper-plugin-utils'
import { addDefault } from '@babel/helper-module-imports'

export const testSourceCode = `
	import aa from 'aa';
	import * as bb from 'bb';
	import {cc} from 'cc';
	import 'dd';

	function a () {
			console.log('aaa');
	}

	class B {
			bb() {
					return 'bbb';
			}
	}

	const c = () => 'ccc';

	const d = function foo() {
			console.log('ddd');
	}
`

export default declare((api, option) => {
  return {
    name: 'function-buried-point',

    visitor: {
			Program: {
				enter(path, state) {
					path.traverse({
						ImportDeclaration(curPath) {
							const requirePath = curPath.get('source').node.value

							if (requirePath !== option.path)
								return
							
							// 获取模块引入变量的说明符, 通过它可以判断模块的引入方式, 如: default import / named import
							// import path from './path/index'  -> path
							const specifierPath = curPath.get('specifiers.0')
							
							// 处理 import { path } from 'xx' / import { path as path 1 } from 'xx'
							if (specifierPath.isImportSpecifier())
								state.trackerImportId = specifierPath.get('local').toString()
							
							// 处理 import * path from 'xx'
							if (specifierPath.isImportNamespaceSpecifier())
								state.trackerImportId = specifierPath.get('local').toString()
							
							// 处理 import path from 'xx'
							if (specifierPath.isImportDefaultSpecifier())
								state.trackerImportId = specifierPath.toString()
							
							// 停止后续 ImportDeclaration 的遍历
							curPath.stop()
						}
					})

					if (!state.trackerImportId) 
						// 自动引入 tracker module
						state.trackerImportId = addDefault(path, option.path, {
							nameHint: path.scope.generateUid('tracker')
						}).name

					// 生成 tracker 函数调用的 AST -> tracker() 的 AST
					state.trackerAST = api.template.statement(`${state.trackerImportId}()`)()
				}
			},

			// 
			'ArrowFunctionExpression|ClassMethod|FunctionExpression|FunctionDeclaration'(path, state) {
				const bodyPath = path.get('body')
				// 判断有没有函数体, 在某些情况下可能不存在函数体, 如: const add = () => 1
				if (bodyPath.isBlockStatement()) {
					bodyPath.node.body.unshift(state.trackerAST)
				} else {
					// 生成一个含有函数体的 ast
					const ast = api.template.statement(`{ TRACKER_CALL; return PREV_BODY; }`)({
						TRACKER_CALL: state.trackerAST,
						PREV_BODY: bodyPath.node
					})
					bodyPath.replaceWith(ast)
				}
			}
    }
  }
})
