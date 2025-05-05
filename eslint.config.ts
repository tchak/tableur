import eslint from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import lingui from 'eslint-plugin-lingui';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['.react-router', 'app/locales', 'app/generated', 'build'],
  },
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  lingui.configs['flat/recommended'],
  {
    ...react.configs.flat.recommended,
    settings: { react: { version: 'detect' } },
  },
  react.configs.flat['jsx-runtime'] ?? {},
  reactHooks.configs['recommended-latest'],
  jsxA11y.flatConfigs.recommended,
  {
    rules: {
      'react/jsx-no-constructed-context-values': 'error',
    },
  }
);
