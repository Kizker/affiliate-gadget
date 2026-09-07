import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'tests/e2e/**', '.agents/**'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
      'server-only': path.resolve(
        process.cwd(),
        './tests/mocks/server-only.ts'
      ),
    },
  },
})
