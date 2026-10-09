/**
 * Shared ESLint flat config for the React front ends (app, agent UIs, @akaya/ui).
 * Usage (eslint.config.js):  import { reactConfig } from '@akaya/config/eslint'; export default reactConfig({ ignores: ['dist'] });
 */
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export function reactConfig({ ignores = ['dist'] } = {}) {
  return tseslint.config(
    { ignores },
    {
      extends: [js.configs.recommended, ...tseslint.configs.recommended],
      files: ['**/*.{ts,tsx}'],
      languageOptions: { ecmaVersion: 2022, globals: globals.browser },
      plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
      rules: {
        ...reactHooks.configs.recommended.rules,
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      },
    },
  );
}
