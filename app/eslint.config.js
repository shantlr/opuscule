import globals from 'globals';
import pluginJs from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

const compat = new FlatCompat();

export default [
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  eslintPluginPrettierRecommended,
  ...compat.config({
    extends: ['plugin:react-hooks/recommended'],
    rules: {
      'react-hooks/exhaustive-deps': 'error',
    },
  }),
  {
    rules: {
      'react/prop-types': 'off',
      // 'react/react-in-jsx-scope': 'off',
      // 'import/no-unresolved': 'off',
      // 'import/order': ['error', {
      //   "newlines-between": "always",
      //   "pathGroupsExcludedImportTypes": ["builtin"],
      //   pathGroups: [],
      // }]
    },
  },
];
