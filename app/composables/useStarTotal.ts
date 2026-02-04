import { ref } from 'vue'
import { gqlRequest } from '~/utils/graphql'
import { buildRepoUrl, type RepoInfo } from '~/utils/repo'

const TOTAL_QUERY = `
  query GetStarTotal($name: String!, $owner: String!) {
    repository(name: $name, owner: $owner) {
      stargazers {
        totalCount
      }
    }
  }
`

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
      const data = await gqlRequest<{
        repository: { stargazers: { totalCount: number } }
      }>(TOTAL_QUERY, { owner: repo.owner, name: repo.name })
      const count = data?.repository?.stargazers?.totalCount ?? null
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
