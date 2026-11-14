import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'

/**
 * Flat ESLint config.
 *
 * This config is intentionally pragmatic. Rules that catch real bugs
 * (undefined globals, unused bindings, hook mistakes, accessibility slips)
 * are enabled. A handful of rules fire on pre-existing patterns in the
 * codebase and are set to `warn` so CI stays green while the backlog is
 * worked through; see the "Backlog" section below.
 */
export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.wrangler/**',
      'public/**',
      'coverage/**',
    ],
  },

  js.configs.recommended,

  // Empty `catch {}` blocks are an intentional, common pattern here (best-effort
  // localStorage / analytics writes). Keep the rule for real empty blocks.
  {
    files: ['**/*.{js,jsx,mjs}'],
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },

  // React app source.
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...reactHooks.configs.flat.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,

      // The project doesn't use PropTypes.
      'react/prop-types': 'off',
      // Apostrophes in copy are fine.
      'react/no-unescaped-entities': 'off',

      // Allow intentionally-unused args/vars prefixed with an underscore.
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // --- Backlog (pre-existing patterns; tracked as warnings) ---
      // Anonymous components in a few render helpers.
      'react/display-name': 'warn',
      // New React-Compiler-era rules; the codebase predates them.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/purity': 'warn',
      // Accessibility backlog: labels, clickable divs, and autofocus.
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/interactive-supports-focus': 'warn',
    },
  },

  // Node tooling: Cloudflare Worker and build scripts.
  {
    files: ['worker/**/*.{js,mjs}', 'scripts/**/*.mjs', '**/*.test.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },

  // Root config files (Vite/PostCSS/Tailwind) run in a Node context.
  {
    files: ['*.config.js', 'postcss.config.js', 'tailwind.config.js'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.node, __dirname: 'readonly', __filename: 'readonly' },
    },
  },
]
