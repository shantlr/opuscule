import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import importPlugin from 'eslint-plugin-import';

import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: [
      'api/**/*.{js,mjs,cjs,ts,jsx,tsx}',
      'app/**/*.{js,mjs,cjs,ts,jsx,tsx}',
    ],
  },
  {
    ignores: ['node_modules', 'dist', 'build'],
  },
  {
    ignores: ['api/src/router/index.ts'],
  },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,

  eslintConfigPrettier,
  eslintPluginPrettierRecommended,
  {
    ...importPlugin.flatConfigs.recommended,
    ...importPlugin.flatConfigs.typescript,
  },

  {
    rules: {
      'react/react-in-jsx-scope': 'off',
    },
  },
  // App
  {
    files: ['app/tailwind.config.js'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['app/metro.config.js', 'app/babel.config.js'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: [
      'app/**/*.{js,mjs,cjs,ts,jsx,tsx}',
      'api/**/*.{js,mjs,cjs,ts,jsx,tsx}',
    ],
    rules: {
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
          },
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
        },
      ],
    },
  },
];
