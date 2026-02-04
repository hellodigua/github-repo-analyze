import { ref } from 'vue'
import { gqlRequest } from '~/utils/graphql'
import { formatDateKey } from '~/utils/date'
import type { RepoInfo } from '~/utils/repo'
import type { DailyData } from '~/utils/chart'

const CACHE_VERSION = 3
const CACHE_PREFIX = 'LOCAL_REPO_CACHE:'

interface RepoCache {
  version: number
  lastFetchedAt: string | null
  endCursor: string | null
  daily: DailyData
}

const STARS_QUERY = `
  query GetStars($name: String!, $owner: String!, $after: String) {
    repository(name: $name, owner: $owner) {
      stargazers(first: 100, after: $after, orderBy: { field: STARRED_AT, direction: ASC }) {
        edges {
          starredAt
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
`

const buildCacheKey = (repo: RepoInfo) => `${CACHE_PREFIX}${repo.owner.toLowerCase()}/${repo.name.toLowerCase()}`

const readRepoCache = (repo: RepoInfo): RepoCache | null => {
  if (!import.meta.client) return null
  try {
    const raw = localStorage.getItem(buildCacheKey(repo))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Check version and essential fields
    if (!parsed || parsed.version !== CACHE_VERSION || !parsed.daily) {
      return null
    }
    return parsed as RepoCache
  } catch {
    return null
  }
}

const writeRepoCache = (repo: RepoInfo, payload: RepoCache) => {
  if (!import.meta.client) return
  localStorage.setItem(buildCacheKey(repo), JSON.stringify(payload))
}

const removeRepoCache = (repo: RepoInfo) => {
  if (!import.meta.client) return
  localStorage.removeItem(buildCacheKey(repo))
}

export const useStars = () => {
  const loading = ref(false)
  const finished = ref(false)
  const repo = ref<RepoInfo | null>(null)
  const data = ref<DailyData | undefined>(undefined)
  const error = ref<Error | null>(null)
  const currentRunId = ref(0)

  // 入口：开始拉取（支持增量与强制刷新）
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
    let after: string | null = null
    let currentCursor: string | null = null
    let newestFetchedAt: string | null = null

    if (repoInfo.forceRefresh) {
      removeRepoCache(repoInfo)
      data.value = undefined
    } else {
      cached = readRepoCache(repoInfo)
      if (cached?.daily) {
        data.value = cached.daily
        after = cached.endCursor || null
        currentCursor = cached.endCursor || null
        newestFetchedAt = cached.lastFetchedAt || null
      } else {
        data.value = undefined
      }
    }

    try {
      // ASC 分页拉取
      while (true) {
        const result = await gqlRequest<{
          repository: {
            stargazers: {
              edges: Array<{ starredAt: string }>
              pageInfo: { endCursor: string | null; hasNextPage: boolean }
            }
          }
        }>(STARS_QUERY, {
          owner: repoInfo.owner,
          name: repoInfo.name,
          after,
        })

        if (currentRunId.value !== runId) return

        const stargazers = result?.repository?.stargazers
        const edges = stargazers?.edges || []
        const pageInfo = stargazers?.pageInfo
        const endCursor = pageInfo?.endCursor || null
        const hasNextPage = Boolean(pageInfo?.hasNextPage)

        if (!edges.length) {
          break
        }

        const delta: Record<string, number> = {}

        for (const { starredAt } of edges) {
          // 更新最新时间
          if (!newestFetchedAt || new Date(starredAt) > new Date(newestFetchedAt)) {
            newestFetchedAt = starredAt
          }
          const key = formatDateKey(new Date(starredAt))
          delta[key] = (delta[key] || 0) + 1
        }

        // 增量更行 Data
        if (Object.keys(delta).length) {
          const nextData: DailyData = { ...(data.value || {}) }
          Object.entries(delta).forEach(([key, count]) => {
            const prev = nextData[key]?.count || 0
            nextData[key] = { count: prev + count }
          })
          data.value = nextData
        }

        currentCursor = endCursor

        if (!hasNextPage) {
          break
        }
        after = endCursor
      }

      if (currentRunId.value !== runId) return
      finished.value = true

      // Save Cache
      writeRepoCache(repoInfo, {
        version: CACHE_VERSION,
        lastFetchedAt: newestFetchedAt,
        endCursor: currentCursor,
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
