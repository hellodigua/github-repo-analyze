# Github Repo Analyze

## Overview

Github Repo Analyze is a lightweight tool that visualizes GitHub repository star history using the GitHub GraphQL API.

## Features

- Search by full repo URL and track daily/total star trends
- Interactive ECharts dashboards with zoom and data toggles
- Local cache and history for faster re-visits
- One-click export of chart image and raw JSON data
- GitHub API rate-limit status and reset time

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

- GraphQL endpoint: `https://api.github.com/graphql`
- Token (recommended for higher rate limits):
  - `NUXT_GITHUB_TOKEN=...` or `NUXT_PUBLIC_GITHUB_TOKEN=...`

## GitHub Pages Deployment

1. Push to `main` to trigger the workflow
2. In repo settings: `Settings` → `Pages`, set `Build and deployment` to `GitHub Actions`
3. Typical URLs:
   - User/Org page: `https://<user>.github.io/`
   - Project page: `https://<user>.github.io/<repo>/`
