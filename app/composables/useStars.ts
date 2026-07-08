import { ref } from 'vue'
import { githubGraphqlRequest } from '~/utils/github'
import { formatDateKey } from '~/utils/date'
import type { RepoInfo } from '~/utils/repo'
import type { DailyData } from '~/utils/chart'

const CACHE_VERSION = 6
const CACHE_PREFIX = 'LOCAL_REPO_CACHE:'
const PAGE_SIZE = 100
const CACHE_FRESH_MS = 30 * 60 * 1000

interface RepoCache {
  version: number
  lastCursor: string | null
  cachedAt?: number
  daily: DailyData
}

interface StargazerEdge {
  starredAt?: string | null
}

interface StargazersPage {
  repository?: {
    stargazers?: {
      edges?: StargazerEdge[]
      pageInfo?: {
        hasNextPage?: boolean
        endCursor?: string | null
      }
    }
  }
}

const buildCacheKey = (repo: RepoInfo) => `${CACHE_PREFIX}${repo.owner.toLowerCase()}/${repo.name.toLowerCase()}`

const canUseLocalStorage = () => typeof localStorage !== 'undefined'

const STARGAZERS_QUERY = `
  query RepoStargazers($owner: String!, $name: String!, $cursor: String, $pageSize: Int!) {
    repository(owner: $owner, name: $name) {
      stargazers(first: $pageSize, after: $cursor, orderBy: { field: STARRED_AT, direction: ASC }) {
        edges {
          starredAt
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`

const readRepoCache = (repo: RepoInfo): RepoCache | null => {
  if (!canUseLocalStorage()) return null
  try {
    const raw = localStorage.getItem(buildCacheKey(repo))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Check version and essential fields
    if (
      !parsed ||
      parsed.version !== CACHE_VERSION ||
      !parsed.daily ||
      !(typeof parsed.lastCursor === 'string' || parsed.lastCursor === null)
    ) {
      return null
    }
    return parsed as RepoCache
  } catch {
    return null
  }
}

const writeRepoCache = (repo: RepoInfo, payload: RepoCache) => {
  if (!canUseLocalStorage()) return
  localStorage.setItem(buildCacheKey(repo), JSON.stringify(payload))
}

const removeRepoCache = (repo: RepoInfo) => {
  if (!canUseLocalStorage()) return
  localStorage.removeItem(buildCacheKey(repo))
}

const isFreshCache = (cached: RepoCache) =>
  typeof cached.cachedAt === 'number' && Date.now() - cached.cachedAt < CACHE_FRESH_MS

export const useStars = () => {
  const loading = ref(false)
  const finished = ref(false)
  const repo = ref<RepoInfo | null>(null)
  const data = ref<DailyData | undefined>(undefined)
  const error = ref<Error | null>(null)
  const currentRunId = ref(0)

  // 入口：开始拉取（使用 GraphQL 分页，缓存新鲜时直接复用，过期后再增量检查）
  const startLoadStars = async (
    repoInfo: RepoInfo & {
      forceRefresh?: boolean
    }
  ) => {
    if (!repoInfo) return
    const runId = ++currentRunId.value
    loading.value = true
    finished.value = false
    error.value = null
    repo.value = { owner: repoInfo.owner, name: repoInfo.name }

    let cached: RepoCache | null = null
    let baseDaily: DailyData = {}
    let startCursor: string | null = null
    let hasCache = false

    if (repoInfo.forceRefresh) {
      removeRepoCache(repoInfo)
      data.value = undefined
    } else {
      cached = readRepoCache(repoInfo)
      if (cached?.daily && (typeof cached.lastCursor === 'string' || cached.lastCursor === null)) {
        // 命中缓存时先展示旧数据，再从上次 GraphQL cursor 之后继续拉取新增 star。
        data.value = cached.daily
        baseDaily = { ...cached.daily }
        startCursor = cached.lastCursor
        hasCache = true
        if (isFreshCache(cached)) {
          finished.value = true
          loading.value = false
          return
        }
      } else {
        data.value = undefined
      }
    }

    try {
      // GitHub REST stargazers 在当前环境会对公开仓库返回隐藏式 404；
      // GraphQL stargazers edges 仍能稳定返回 starredAt，并通过 cursor 做增量分页。
      // 每页拿到就合并并刷新 data，保证用户能逐步看到图表结果
      const nextData: DailyData = baseDaily
      if (!hasCache) {
        data.value = { ...nextData }
      }

      let currentCursor = startCursor
      let hasNext = true
      let lastCursor = startCursor

      while (hasNext) {
        if (currentRunId.value !== runId) return
        const pageData = await githubGraphqlRequest<StargazersPage>(STARGAZERS_QUERY, {
          owner: repoInfo.owner,
          name: repoInfo.name,
          cursor: currentCursor,
          pageSize: PAGE_SIZE,
        })
        if (currentRunId.value !== runId) return

        const stargazers = pageData.repository?.stargazers
        const edges = stargazers?.edges || []
        for (const item of edges) {
          const starredAt = item.starredAt
          if (!starredAt) continue
          const key = formatDateKey(new Date(starredAt))
          const prev = nextData[key]?.count || 0
          nextData[key] = { count: prev + 1 }
        }

        if (currentRunId.value !== runId) return
        data.value = { ...nextData }
        const nextCursor = stargazers?.pageInfo?.endCursor || null
        hasNext = Boolean(stargazers?.pageInfo?.hasNextPage && nextCursor)
        lastCursor = nextCursor || lastCursor
        currentCursor = nextCursor
      }

      if (currentRunId.value !== runId) return
      finished.value = true

      // Save Cache
      writeRepoCache(repoInfo, {
        version: CACHE_VERSION,
        lastCursor,
        cachedAt: Date.now(),
        daily: data.value || {},
      })
    } catch (err) {
      error.value = err as Error
    } finally {
      if (currentRunId.value === runId) {
        loading.value = false
      }
    }
  }

  return {
    startLoadStars,
    repo,
    data,
    loading,
    finished,
    error,
  }
}
