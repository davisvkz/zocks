const path = require('node:path');

/** @type {import("eslint").Linter.Config} */
module.exports = {
	extends: [
		'./base.cjs',
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/recommended-requiring-type-checking',
	],
	env: {
		es2022: true,
		node: true,
	},
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: [path.resolve(__dirname, '../../src/tsconfig.json')],
		tsconfigRootDir: path.resolve(__dirname, '../../src'),
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint'],
	rules: {
		'@typescript-eslint/consistent-type-imports': [
			'error',
			{ prefer: 'type-imports', fixStyle: 'separate-type-imports' },
		],
		'@typescript-eslint/no-unused-vars': [
			'error',
			{
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
				caughtErrorsIgnorePattern: '^_',
			},
		],
		'@typescript-eslint/no-misused-promises': [
			'error',
			{ checksVoidReturn: false },
		],
		'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
		'@typescript-eslint/no-floating-promises': 'off',
		'@typescript-eslint/unbound-method': 'off',
		'@typescript-eslint/restrict-template-expressions': 'off',
		'@typescript-eslint/no-redeclare': 'off',
		'@typescript-eslint/require-await': 'off',
		'@typescript-eslint/no-use-before-define': [
			'error',
			{ functions: false, classes: false },
		],
		'no-use-before-define': 'off',
		'import/extensions': 'off',
		'consistent-return': 'off',
		'class-methods-use-this': 'off',
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
	overrides: [
		{
			files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
			rules: {
				'@typescript-eslint/no-explicit-any': 'off',
				'@typescript-eslint/no-empty-function': 'off',
				'@typescript-eslint/no-non-null-assertion': 'off',
			},
			globals: {
				describe: 'readonly',
				it: 'readonly',
				test: 'readonly',
				expect: 'readonly',
				vi: 'readonly',
				beforeEach: 'readonly',
				afterEach: 'readonly',
				beforeAll: 'readonly',
				afterAll: 'readonly',
			},
		},
	],
	reportUnusedDisableDirectives: true,
};
