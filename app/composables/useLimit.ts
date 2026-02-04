import { ref, onMounted } from 'vue'
import { githubRequest } from '~/utils/github'

export const useLimit = () => {
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const remaining = ref(0)
  const gameover = ref<boolean | undefined>(undefined)
  const resetDate = ref<string | undefined>(undefined)

  // 查询 REST API 的 core 限额，用于前端提示剩余额度
  const refresh = async () => {
    loading.value = true
    error.value = null
    try {
      const { data } = await githubRequest<{
        resources?: {
          core?: { remaining: number; reset: number }
        }
      }>('/rate_limit')
      const left = data?.resources?.core?.remaining ?? 0
      const resetAt = data?.resources?.core?.reset
      remaining.value = left
      gameover.value = left === 0
      resetDate.value = resetAt
        ? `${new Date(resetAt * 1000).toLocaleDateString()} ${new Date(resetAt * 1000).toLocaleTimeString()}`
        : undefined
    } catch (err) {
      error.value = err as Error
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    refresh()
  })

  return {
    loading,
    error,
    remaining,
    gameover,
    resetDate,
    refresh,
  }
}
