# 项目介绍

Github Repo Analyze 是一个轻量级 Web 工具，用于可视化展示 GitHub 仓库的 Star 历史趋势，并提供交互式数据看板。

# 技术栈

- 语言：TypeScript
- 框架/库：Nuxt 4、Vue 3、ECharts、vue-echarts、Pinia、Nuxt UI、Tailwind CSS
- 构建与依赖管理：pnpm、Nuxt（build/generate/preview）
- 运行与部署：Node.js v20.19.3、GitHub Pages（基于 GitHub Actions）

# 关键功能

- 拉取仓库 Star 历史数据，展示每日/累计趋势
- ECharts 交互式图表（缩放、切换等）
- 本地缓存与历史记录，便于快速回看
- 导出图表图片与原始 JSON 数据
- 可选 GitHub Token 输入以提升 API 速率限制

# 目录结构（可选）

- app/：应用页面与核心前端逻辑
- public/：静态资源
- .docs/：项目文档
- .github/：CI/CD 与相关配置

# 备注/待确认（可选）

- TODO: 若有自定义 API 代理或后端服务，需补充说明
