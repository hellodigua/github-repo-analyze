import { ref } from 'vue'
import { githubRequest, getNextPageUrl, STAR_ACCEPT } from '~/utils/github'
import { formatDateKey } from '~/utils/date'
import type { RepoInfo } from '~/utils/repo'
import type { DailyData } from '~/utils/chart'

const CACHE_VERSION = 4
const CACHE_PREFIX = 'LOCAL_REPO_CACHE:'

interface RepoCache {
  version: number
  lastFetchedAt: string | null
  endCursor: string | null
  daily: DailyData
}

interface StargazerItem {
  starred_at: string
}

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

  // 入口：开始拉取（使用 REST 全量分页，缓存命中则直接复用）
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
    let newestFetchedAt: string | null = null

    if (repoInfo.forceRefresh) {
      removeRepoCache(repoInfo)
      data.value = undefined
    } else {
      cached = readRepoCache(repoInfo)
      if (cached?.daily) {
        data.value = cached.daily
        newestFetchedAt = cached.lastFetchedAt || null
        finished.value = true
        loading.value = false
        return
      } else {
        data.value = undefined
      }
    }

    try {
      // REST 接口需要通过 Link 头分页，直至没有 next
      // 每页拿到就合并并刷新 data，保证用户能逐步看到图表结果
      const nextData: DailyData = {}
      data.value = {}
      let nextUrl = `/repos/${repoInfo.owner}/${repoInfo.name}/stargazers`

      while (nextUrl) {
        if (currentRunId.value !== runId) return
        const { data: pageData, headers } = await githubRequest<StargazerItem[]>(nextUrl, {
          accept: STAR_ACCEPT,
          params: { per_page: '100' },
        })
        if (currentRunId.value !== runId) return

        for (const item of pageData || []) {
          const starredAt = item.starred_at
          if (!starredAt) continue
          if (!newestFetchedAt || new Date(starredAt) > new Date(newestFetchedAt)) {
            newestFetchedAt = starredAt
          }
          const key = formatDateKey(new Date(starredAt))
          const prev = nextData[key]?.count || 0
          nextData[key] = { count: prev + 1 }
        }

        if (currentRunId.value !== runId) return
        data.value = { ...nextData }
        nextUrl = getNextPageUrl(headers.get('link'))
      }

      if (currentRunId.value !== runId) return
      finished.value = true

      // Save Cache
      writeRepoCache(repoInfo, {
        version: CACHE_VERSION,
        lastFetchedAt: newestFetchedAt,
        endCursor: null,
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
