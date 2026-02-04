// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import prettierConfig from 'eslint-config-prettier'

export default withNuxt(
  // Your custom configs here
  {
    rules: {
      // 禁用与 Prettier 冲突的规则
      'prettier/prettier': 'error',
      // 禁用仅有静态方法的类规则，项目中广泛使用服务类模式
      '@typescript-eslint/no-extraneous-class': 'off',
      // 禁用 v-html 的警告
      'vue/no-v-html': 'off',
    },
  },
  {
    // 添加 Prettier 配置 (flat config 兼容方式)
    plugins: {
      prettier: (await import('eslint-plugin-prettier')).default,
    },
    rules: {
      ...prettierConfig.rules,
    },
  }
)
