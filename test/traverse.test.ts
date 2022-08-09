import { it, expect } from 'vitest'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import traverse from '../src/module-traverse'

const __dirname = dirname(fileURLToPath(import.meta.url))

it('traverse', () => {
	expect(traverse(resolve(__dirname, '../mock/index.js'))).toMatchInlineSnapshot(`
		{
		  "allModules": {
		    "/Users/liukai/Desktop/babel-setup/mock/a.js": DependencyNode {
		      "exports": [
		        {
		          "name": "aa1",
		          "type": "named",
		        },
		        {
		          "name": "aa2",
		          "type": "named",
		        },
		        {
		          "name": "add",
		          "type": "default",
		        },
		        {
		          "source": "./b",
		          "type": "all",
		        },
		      ],
		      "imports": {},
		      "path": "/Users/liukai/Desktop/babel-setup/mock/a.js",
		      "subModule": {},
		    },
		    "/Users/liukai/Desktop/babel-setup/mock/index.js": DependencyNode {
		      "exports": [],
		      "imports": {
		        "/Users/liukai/Desktop/babel-setup/mock/a": [
		          {
		            "local": "aa",
		            "type": "namespace",
		          },
		        ],
		      },
		      "path": "/Users/liukai/Desktop/babel-setup/mock/index.js",
		      "subModule": {
		        "/Users/liukai/Desktop/babel-setup/mock/a": DependencyNode {
		          "exports": [
		            {
		              "name": "aa1",
		              "type": "named",
		            },
		            {
		              "name": "aa2",
		              "type": "named",
		            },
		            {
		              "name": "add",
		              "type": "default",
		            },
		            {
		              "source": "./b",
		              "type": "all",
		            },
		          ],
		          "imports": {},
		          "path": "/Users/liukai/Desktop/babel-setup/mock/a.js",
		          "subModule": {},
		        },
		      },
		    },
		  },
		  "root": DependencyNode {
		    "exports": [],
		    "imports": {
		      "/Users/liukai/Desktop/babel-setup/mock/a": [
		        {
		          "local": "aa",
		          "type": "namespace",
		        },
		      ],
		    },
		    "path": "/Users/liukai/Desktop/babel-setup/mock/index.js",
		    "subModule": {
		      "/Users/liukai/Desktop/babel-setup/mock/a": DependencyNode {
		        "exports": [
		          {
		            "name": "aa1",
		            "type": "named",
		          },
		          {
		            "name": "aa2",
		            "type": "named",
		          },
		          {
		            "name": "add",
		            "type": "default",
		          },
		          {
		            "source": "./b",
		            "type": "all",
		          },
		        ],
		        "imports": {},
		        "path": "/Users/liukai/Desktop/babel-setup/mock/a.js",
		        "subModule": {},
		      },
		    },
		  },
		}
	`)
})