// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  devServer: {
    host: '0.0.0.0',
    port: 3110,
  },

  // SSG配置
  ssr: true,

  // 模块配置
  modules: [
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/ui',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
  ],

  // 路由配置
  router: {
    options: {
      strict: false,
    },
  },

  // 应用配置
  app: {
    head: {
      title: 'Github Repo Analyze',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'shortcut icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'manifest', href: '/manifest.json' },
      ],
      meta: [
        { charset: 'utf-8' },
        { name: 'description', content: 'A clean Nuxt template.' },
        { name: 'keywords', content: 'nuxt,template' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'Github Repo Analyze' },
        { property: 'og:title', content: 'Github Repo Analyze' },
        { property: 'og:description', content: 'A clean Nuxt template.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://example.com' },
      ],
      script: [],
    },
  },

  // 运行时配置：GitHub GraphQL
  runtimeConfig: {
    githubToken: '',
    githubGraphqlUrl: 'https://api.github.com/graphql',
    public: {
      githubToken: '',
      githubGraphqlUrl: 'https://api.github.com/graphql',
    },
  },

  // 样式配置
  css: ['~/assets/css/main.css'],

  // 图标配置
  icon: {
    mode: 'css',
    clientBundle: {
      scan: true,
      sizeLimitKb: 256,
    },
    customCollections: [],
  },

  // 颜色模式配置
  colorMode: {
    // preference: 'dark', // 默认暗黑模式
    preference: 'system', // 跟随系统主题
    fallback: 'light',
  },

  // 构建配置
  build: {
    transpile: ['@nuxt/ui'],
  },

  // Vite 配置
  vite: {
    css: {
      devSourcemap: true,
    },
    build: {
      sourcemap: false, // 生产环境关闭 sourcemap 以避免警告
    },
  },

  // TypeScript 配置
  typescript: {
    typeCheck: false, // 开发时禁用自动类型检查
    strict: false, // 开发时使用宽松模式
  },

  // 实验性功能
  experimental: {
    payloadExtraction: false,
    inlineSSRStyles: true,
  },
})
