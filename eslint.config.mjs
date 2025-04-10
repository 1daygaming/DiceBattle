import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import typescriptEslint from 'typescript-eslint';

export default typescriptEslint.config(
  { ignores: ['*.d.ts', '**/coverage', '**/dist', 'node_modules', './src/env.d.ts', './src/types/*.d.ts'] },
  {
    extends: [
      eslint.configs.recommended,
      ...typescriptEslint.configs.recommended,
      ...eslintPluginVue.configs['flat/base'],
      ...eslintPluginVue.configs['flat/recommended'],
      ...eslintPluginVue.configs['flat/strongly-recommended']
    ],
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        parser: typescriptEslint.parser,
      },
    },
    rules: {
      "vue/max-attributes-per-line": ["error", {
        "singleline": {
          "max": 1
        },      
        "multiline": {
          "max": 1
        }
      }]
    },
  },
  
  eslintConfigPrettier
);