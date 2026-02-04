# Github Repo Analyze

## Overview

Github Repo Analyze is a lightweight web tool that visualizes GitHub repository star history with a clean, interactive dashboard.

## Features

- Fetch star history and show daily/total trends
- Interactive ECharts charts with zoom and toggles
- Local cache and history for quick re-visits
- Export chart image and raw JSON data
- Optional token input to raise API rate limits

## Tech Stack

- Nuxt 4, Vue 3, TypeScript
- ECharts + vue-echarts
- Pinia, Nuxt UI, Tailwind CSS

## Getting Started

- Install: `pnpm install`
- Dev: `pnpm dev`
- Build: `pnpm build`
- Generate: `pnpm generate`
- Preview: `pnpm preview`

## Scripts

- `pnpm dev` - Start local dev server
- `pnpm build` - Build for production
- `pnpm generate` - Generate static output
- `pnpm preview` - Preview production build
- `pnpm lint` / `pnpm lint:fix` - Lint code
- `pnpm typecheck` - Run TypeScript checks
- `pnpm analyze` - Analyze bundle

## Configuration

- GitHub API base: `https://api.github.com`
- Token (optional):
  - UI input (stored in localStorage)
  - Env: `NUXT_GITHUB_TOKEN=...` or `NUXT_PUBLIC_GITHUB_TOKEN=...`

## GitHub Pages Deployment

1. Push to `main` to trigger the workflow
2. In repo settings: `Settings` → `Pages`, set `Build and deployment` to `GitHub Actions`
3. Typical URLs:
   - User/Org page: `https://<user>.github.io/`
   - Project page: `https://<user>.github.io/<repo>/`
