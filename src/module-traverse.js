import { readFileSync, existsSync, lstatSync } from 'fs'
import { join, resolve } from 'path'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'

class DependencyNode {
  constructor(modulePath = '', imports = {}, exports = []) {
    this.path = modulePath
    this.imports = imports
    this.exports = exports
    this.subModule = {}
  }
}

function isDirectory(modulePath) {
  try {
    return lstatSync(modulePath).isDirectory()
  } catch {
    return false
  }
}

function completeModulePath(modulePath) {
  const EXTS = ['.tsx', '.jsx', '.js', '.ts']

  function tryCompletePath(resolvePath) {
    for (let exit of EXTS.values()) {
      const tryPath = resolvePath(exit)

      // 判断是否存在
      if (existsSync(tryPath)) {
        return tryPath
      }
    }
  }

  // 判断是不是目录
  if (isDirectory(modulePath)) {
    // 补全 index[EXT]
    const completePath = tryCompletePath(ext =>
      join(modulePath, `index.${ext}`)
    )

    if (!completePath) {
      throw new Error('notfound module, path' + modulePath)
    } else {
      return completePath
    }
  }
  // 如果路径没有文件后缀，则进行补全
  else if (!EXTS.some(ext => modulePath.endsWith(ext))) {
    const completePath = tryCompletePath(ext => modulePath + ext)

    if (!completePath) {
      throw new Error('notfound module, path' + modulePath)
    } else {
      return completePath
    }
  }

  return modulePath
}

function resolvePlugins(modulePath) {
  const plugins = []
  if (['.jsx', '.tsx'].some(i => modulePath.endsWith(i))) {
    plugins.push('jsx')
  }

  if (['.ts', '.tsx'].some(i => modulePath.endsWith(i))) {
    plugins.push('typescript')
  }

  return plugins
}

function traverseJsModule(modulePath, node, allModules) {
  node.path = completeModulePath(modulePath)
  allModules[node.path] = node

  const content = readFileSync(node.path, {
    encoding: 'utf-8'
  })

  const ast = parse(content, {
    sourceType: 'unambiguous',
    plugins: resolvePlugins(node.path)
  })

  traverse(ast, {
    ImportDeclaration(path) {
      const sourceValue = path.get('source').node.value
      const subModulePath = resolve(modulePath, '../', sourceValue)

      const specifiersPaths = path.get('specifiers')
      node.imports[subModulePath] = specifiersPaths.map(specifiersPath => {
        if (specifiersPath.isImportSpecifier())
          return {
            type: 'deconstruct',
            imported: specifiersPath.get('imported').node.name,
            local: specifiersPath.get('local').node.name
          }

        if (specifiersPath.isImportNamespaceSpecifier())
          return {
            type: 'namespace',
            local: specifiersPath.get('local').node.name
          }

        if (specifiersPath.isImportDefaultSpecifier())
          return {
            type: 'default',
            local: specifiersPath.get('local').node.name
          }
      })

      node.subModule[subModulePath] = new DependencyNode()
      traverseJsModule(subModulePath, node.subModule[subModulePath], allModules)
    },

    ExportDeclaration(path) {
      let exports = []
      if (path.isExportNamedDeclaration()) {
        exports = path.get('specifiers').map(specifierPath => {
          return {
            type: 'named',
            name: specifierPath.get('local').node.name
          }
        })

        const declaration = path.get('declaration')
        if (declaration) {
          exports.push({
            type: 'named',
            name: declaration.get('declarations')[0].get('id').node.name
          })
        }
      }

      if (path.isExportDefaultDeclaration())
        exports = [
          {
            type: 'default',
            name: path.get('declaration').get('id').node.name
          }
        ]

      if (path.isExportAllDeclaration())
        exports = [
          {
            type: 'all',
            source: path.get('source').node.value
          }
        ]

      node.exports.push(...exports)
    }
  })
}

export default function (modulePath) {
  const dependencyGraph = {
    root: new DependencyNode(),
    allModules: {}
  }
  traverseJsModule(modulePath, dependencyGraph.root, dependencyGraph.allModules)
  return dependencyGraph
}
