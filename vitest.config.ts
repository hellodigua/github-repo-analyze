import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // 测试超时设置
    testTimeout: 10000,
    hookTimeout: 10000,
    // 并行测试
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './app'),
      '@': resolve(__dirname, './app'),
      '#imports': resolve(__dirname, './tests/mocks/nuxt-imports.ts'),
    },
  },
  define: {
    // 定义测试环境变量
    __TEST__: true,
  },
})
