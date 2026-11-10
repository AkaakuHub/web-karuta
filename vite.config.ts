import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: { include: ['src/**/*.test.ts'] },
  lint: {
    rules: {
      'typescript/no-explicit-any': 'error',
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },
  fmt: { singleQuote: true },
});
