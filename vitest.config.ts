import { defineConfig } from 'vitest/config'
import path from 'path'

// Fallback DATABASE_URL for local database tests without overriding unit test mock providers
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/affiliate_gadget'

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
