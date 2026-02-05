import { ref } from 'vue'
import { githubRequest, getNextPageUrl, STAR_ACCEPT } from '~/utils/github'
import { formatDateKey } from '~/utils/date'
import type { RepoInfo } from '~/utils/repo'
import type { DailyData } from '~/utils/chart'

const CACHE_VERSION = 5
const CACHE_PREFIX = 'LOCAL_REPO_CACHE:'
const PAGE_SIZE = 100

interface RepoCache {
  version: number
  lastPage: number
  lastPageCount: number
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

  // 入口：开始拉取（使用 REST 分页，缓存命中时进行增量更新）
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
    let startPage = 1
    let skipCount = 0
    let hasCachePage = false

    if (repoInfo.forceRefresh) {
      removeRepoCache(repoInfo)
      data.value = undefined
    } else {
      cached = readRepoCache(repoInfo)
      if (
        cached?.daily &&
        typeof cached.lastPage === 'number' &&
        typeof cached.lastPageCount === 'number'
      ) {
        // 命中缓存时先展示旧数据，再从上次最后一页开始增量拉取
        data.value = cached.daily
        baseDaily = { ...cached.daily }
        startPage = Math.max(1, cached.lastPage)
        skipCount = Math.max(0, cached.lastPageCount)
        hasCachePage = true
      } else {
        data.value = undefined
      }
    }

    try {
      // REST 接口需要通过 Link 头分页，直至没有 next
      // 每页拿到就合并并刷新 data，保证用户能逐步看到图表结果
      const nextData: DailyData = baseDaily
      if (!hasCachePage) {
        data.value = { ...nextData }
      }

      const path = `/repos/${repoInfo.owner}/${repoInfo.name}/stargazers`
      let currentPage = startPage
      let hasNext = true
      let lastPage = startPage
      let lastPageCount = skipCount

      while (hasNext) {
        if (currentRunId.value !== runId) return
        const { data: pageData, headers } = await githubRequest<StargazerItem[]>(path, {
          accept: STAR_ACCEPT,
          params: { per_page: String(PAGE_SIZE), page: String(currentPage) },
        })
        if (currentRunId.value !== runId) return

        // 增量更新：GitHub 返回按最早 -> 最新排序，缓存记录了上次最后一页的数量
        // 首次请求时需要跳过已缓存的那一部分，只处理新增尾部数据
        const safePageData = pageData || []
        const startIndex = hasCachePage && currentPage === startPage ? Math.min(skipCount, safePageData.length) : 0
        for (let idx = startIndex; idx < safePageData.length; idx += 1) {
          const item = safePageData[idx]
          const starredAt = item.starred_at
          if (!starredAt) continue
          const key = formatDateKey(new Date(starredAt))
          const prev = nextData[key]?.count || 0
          nextData[key] = { count: prev + 1 }
        }

        if (currentRunId.value !== runId) return
        data.value = { ...nextData }
        const nextUrl = getNextPageUrl(headers.get('link'))
        lastPage = currentPage
        lastPageCount = safePageData.length
        if (!nextUrl) {
          hasNext = false
          break
        }
        try {
          const parsed = new URL(nextUrl)
          const nextPage = Number(parsed.searchParams.get('page'))
          currentPage = Number.isFinite(nextPage) && nextPage > 0 ? nextPage : currentPage + 1
        } catch {
          currentPage += 1
        }
      }

      if (currentRunId.value !== runId) return
      finished.value = true

      // Save Cache
      writeRepoCache(repoInfo, {
        version: CACHE_VERSION,
        lastPage,
        lastPageCount,
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
