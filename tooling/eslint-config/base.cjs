const path = require('node:path');

/** @type {import("eslint").Linter.Config} */
module.exports = {
	extends: [
		'turbo',
		'eslint:recommended',
		'plugin:import/recommended',
		'plugin:import/typescript',
		'prettier',
	],
	env: {
		es2022: true,
		node: true,
	},
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	plugins: ['import'],
	settings: {
		'import/resolver': {
			typescript: {
				project: [path.resolve(__dirname, '../../src/tsconfig.json')],
			},
			node: {
				extensions: ['.js', '.jsx', '.ts', '.tsx'],
			},
		},
	},
	rules: {
		'turbo/no-undeclared-env-vars': 'off',
		'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
		'import/no-extraneous-dependencies': 'off',
		'import/prefer-default-export': 'off',
		'import/extensions': 'off',
		'no-console': 'off',
		'no-underscore-dangle': 'off',
		'class-methods-use-this': 'off',
		'no-void': ['error', { allowAsStatement: true }],
	},
	ignorePatterns: [
		'**/*.config.js',
		'**/*.config.cjs',
		'**/*.config.mjs',
		'**/*.config.ts',
		'**/*.eslintrc.*',
		'dist',
		'build',
		'coverage',
		'.turbo',
		'node_modules',
		'pnpm-lock.yaml',
	],
	reportUnusedDisableDirectives: true,
};
