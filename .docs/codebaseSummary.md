# Codebase Summary

## 目录树（节选）

```
.
├── .docs/
├── app/
│   ├── app.vue
│   ├── error.vue
│   ├── assets/
│   │   └── css/main.css
│   ├── components/
│   │   ├── ChartPlaceholder.vue
│   │   ├── GameoverModal.vue
│   │   ├── LimitTip.vue
│   │   ├── RepoHeader.vue
│   │   ├── RepoHistoryTree.vue
│   │   └── TabsCharts.vue
│   ├── composables/
│   │   ├── useLimit.ts
│   │   ├── useRepoHistory.ts
│   │   ├── useStars.ts
│   │   └── useStarTotal.ts
│   ├── layouts/
│   │   └── default.vue
│   ├── pages/
│   │   └── index.vue
│   └── utils/
│       ├── chart.ts
│       ├── date.ts
│       ├── github.ts
│       ├── graphql.ts
│       └── repo.ts
├── public/
│   └── robots.txt
├── nuxt.config.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## 关键文件

- `app/pages/index.vue`: 主页面入口，负责解析路由参数、调度数据拉取、维护状态与错误提示，并组合各组件完成页面布局。
- `app/components/RepoHeader.vue`: 搜索与 Token 输入组件，负责 URL 校验、触发搜索/强制刷新，并持久化 Token。
- `app/components/TabsCharts.vue`: 图表核心组件，组装 ECharts 配置，支持日增/累计切换与导出图片/JSON。
- `app/components/RepoHistoryTree.vue`: 历史记录侧栏渲染与交互，支持选择与删除历史仓库。
- `app/composables/useStars.ts`: 通过 GitHub REST 分页拉取 Star 历史，提供本地缓存与增量更新输出。
- `app/composables/useStarTotal.ts`: 获取仓库总 Star 数并做内存缓存，顺带写入最近访问仓库 URL。
- `app/composables/useLimit.ts`: 拉取 GitHub API 速率限制并计算剩余额度与重置时间。
- `app/composables/useRepoHistory.ts`: 管理本地历史列表的读取/写入与去重逻辑。
- `app/utils/github.ts`: GitHub 请求封装，统一鉴权、URL 构造、分页解析与错误处理。
- `app/utils/chart.ts`: 将按日数据整理为连续日期序列与累计值，供图表展示使用。
- `app/utils/repo.ts`: 负责解析/构建 GitHub 仓库 URL，抽取 owner/name。
- `app/utils/graphql.ts`: GraphQL 请求封装，当前代码中未见调用，可能为后续扩展预留。
- `app/app.vue`: 应用根组件与全局样式入口，包裹 Nuxt UI 容器并设置全局字体。
- `app/error.vue`: 全局错误页，展示状态码与错误信息并提供返回首页入口。
- `nuxt.config.ts`: Nuxt 运行与构建配置，包括模块、运行时 GitHub 配置与 GitHub Pages 预设。

## 备注/待确认（可选）

- TODO: 若 GraphQL 请求流程有实际使用场景，请补充调用入口与用途说明。
