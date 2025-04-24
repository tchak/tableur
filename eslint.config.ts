import eslint from '@eslint/js';
import lingui from 'eslint-plugin-lingui';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['.react-router', 'app/locales', 'app/generated'],
  },
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  lingui.configs['flat/recommended'],
);
