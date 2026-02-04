import { ref } from 'vue'
import { githubRequest } from '~/utils/github'
import { buildRepoUrl, type RepoInfo } from '~/utils/repo'

const totalCache = new Map<string, number>()

export const useStarTotal = () => {
  const total = ref<number | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  // 使用内存缓存避免重复请求同一仓库的总数
  const getTotalCount = async (repo: RepoInfo) => {
    if (!repo) return
    const cacheKey = `${repo.owner}/${repo.name}`
    if (totalCache.has(cacheKey)) {
      total.value = totalCache.get(cacheKey) ?? null
      return
    }
    loading.value = true
    error.value = null
    try {
      const { data } = await githubRequest<{ stargazers_count: number }>(
        `/repos/${repo.owner}/${repo.name}`
      )
      const count = data?.stargazers_count ?? null
      total.value = count
      if (typeof count === 'number') {
        totalCache.set(cacheKey, count)
      }
      if (process.client) {
        localStorage.setItem('LOCAL_REPO_URL', buildRepoUrl(repo))
      }
    } catch (err) {
      error.value = err as Error
    } finally {
      loading.value = false
    }
  }

  return {
    total,
    loading,
    error,
    getTotalCount,
  }
}
