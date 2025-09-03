import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['node_modules/**', 'dist/**', 'build/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      import: (await import('eslint-plugin-import')).default || (await import('eslint-plugin-import'))
    },
    settings: { react: { version: 'detect' } },
    rules: {
      // TypeScript naming conventions
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'variableLike', format: ['camelCase', 'PascalCase', 'UPPER_CASE'], leadingUnderscore: 'allow' },
        { selector: 'typeLike', format: ['PascalCase'] }
      ],
      // React basics
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-pascal-case': 'error',
      // Hooks rules (equivalent to recommended)
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      // Enforce frontend module boundaries (no mixing UI with business logic)
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // Components cannot import from services, store, or pages
            { target: './frontend/src/services', from: './frontend/src/components' },
            { target: './frontend/src/store', from: './frontend/src/components' },
            { target: './frontend/src/pages', from: './frontend/src/components' },
            // Pages should not be imported into components
            { target: './frontend/src/pages', from: './frontend/src/components' },
            // Services cannot import UI (components/pages)
            { target: './frontend/src/components', from: './frontend/src/services' },
            { target: './frontend/src/pages', from: './frontend/src/services' },
            // Store cannot import UI
            { target: './frontend/src/components', from: './frontend/src/store' },
            { target: './frontend/src/pages', from: './frontend/src/store' }
          ]
        }
      ]
    }
  },
  // React-only rules (functional components only)
  {
    files: ['**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "ClassDeclaration[superClass.name='Component'], ClassDeclaration[superClass.name='PureComponent'], ClassDeclaration[superClass.type='MemberExpression'][superClass.object.name='React'][superClass.property.name='Component'], ClassDeclaration[superClass.type='MemberExpression'][superClass.object.name='React'][superClass.property.name='PureComponent']",
          message: 'Class components are not allowed. Use functional components with hooks.'
        }
      ],
          }
  }
];
