/** @type {import('eslint').Linter.Config} */
module.exports = {
	extends: [
		'./typescript.cjs',
		'plugin:react/recommended',
		'plugin:react-hooks/recommended',
		'plugin:jsx-a11y/recommended',
	],
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
	},
	env: {
		browser: true,
	},
	rules: {
		'react/prop-types': 'off',
		'react/react-in-jsx-scope': 'off',
		'react/jsx-props-no-spreading': 'off',
		'react/require-default-props': 'off',
		'react/jsx-filename-extension': ['warn', { extensions: ['.jsx', '.tsx'] }],
		'jsx-a11y/no-autofocus': 'off',
		'jsx-a11y/label-has-associated-control': 'off',
		'react-hooks/exhaustive-deps': 'off',
		'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
		'import/extensions': 'off',
		'import/no-cycle': 'off',
	},
	globals: {
		React: 'writable',
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
};
