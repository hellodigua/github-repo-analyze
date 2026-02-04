import { ref, onMounted } from 'vue'
import { gqlRequest } from '~/utils/graphql'

const LIMIT_QUERY = `
  query getLimit {
    rateLimit {
      remaining
      resetAt
    }
  }
`

export const useLimit = () => {
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const remaining = ref(0)
  const gameover = ref<boolean | undefined>(undefined)
  const resetDate = ref<string | undefined>(undefined)

  const refresh = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await gqlRequest<{
        rateLimit: { remaining: number; resetAt: string }
      }>(LIMIT_QUERY)
      const left = data?.rateLimit?.remaining ?? 0
      const resetAt = data?.rateLimit?.resetAt
      remaining.value = left
      gameover.value = left === 0
      resetDate.value = resetAt
        ? `${new Date(resetAt).toLocaleDateString()} ${new Date(resetAt).toLocaleTimeString()}`
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
