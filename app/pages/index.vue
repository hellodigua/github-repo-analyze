<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ClientError } from 'graphql-request'
import { useRoute } from '#imports'
import { buildRepoUrl, getRepo, type RepoInfo } from '~/utils/repo'
import { useStars } from '~/composables/useStars'
import { useStarTotal } from '~/composables/useStarTotal'
import { useLimit } from '~/composables/useLimit'
import { useRepoHistory } from '~/composables/useRepoHistory'

const route = useRoute()
const toast = useToast()

const input = ref(typeof route.query.repo === 'string' ? route.query.repo : '')
const selectedRepoUrl = ref('')
const initialTab = ref<'bar' | 'line' | 'area'>('bar')

const { total, getTotalCount } = useStarTotal()
const { repo, startLoadStars, data, loading, finished, error } = useStars()
const { remaining, gameover, resetDate } = useLimit()
const { history, addRepo, removeRepo } = useRepoHistory()

// 清空当前选中仓库的所有展示状态（输入框/图表/统计/持久化）
const clearCurrentRepoState = () => {
  input.value = ''
  selectedRepoUrl.value = ''
  total.value = null
  data.value = undefined
  repo.value = null
  finished.value = false
  error.value = null
  if (import.meta.client) {
    localStorage.removeItem('LOCAL_REPO_URL')
  }
}

onMounted(() => {
  if (!input.value && import.meta.client) {
    input.value = localStorage.getItem('LOCAL_REPO_URL') || ''
  }
  if (input.value) {
    selectedRepoUrl.value = input.value
    const repoInfo = getRepo(input.value)
    if (repoInfo) {
      startLoadStars(repoInfo)
      addRepo(repoInfo)
    }
  }
})

// 解析 tab 参数，兼容数字与字符串
const parseTab = (val?: string | null) => {
  if (!val) return 'bar'
  if (val === '1' || val === 'bar') return 'bar'
  if (val === '2' || val === 'line') return 'line'
  if (val === '3' || val === 'area') return 'area'
  return 'bar'
}

watch(
  () => route.query.tab,
  (val) => {
    initialTab.value = parseTab(typeof val === 'string' ? val : null)
  },
  { immediate: true }
)

watch(
  () => input.value,
  (val) => {
    if (!val || gameover.value) return
    const repoInfo = getRepo(val)
    if (repoInfo) {
      getTotalCount(repoInfo)
    }
  }
)

watch(
  () => error.value,
  (err) => {
    if (!err) return
    if (err instanceof ClientError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const type = (err as any).response?.errors?.[0]?.type
      if (type === 'NOT_FOUND') {
        toast.add({ title: 'Repository not found. Please check the URL.', color: 'warning' })
        return
      }
      if (err.response?.status === 401) {
        toast.add({ title: 'Token is invalid or lacks permission.', color: 'error' })
        return
      }
    }
    toast.add({ title: 'Request failed. Check your token or repo URL.', color: 'error' })
  }
)

const handleSearch = (repoInfo: RepoInfo) => {
  const url = buildRepoUrl(repoInfo)
  selectedRepoUrl.value = url
  startLoadStars(repoInfo)
  addRepo(repoInfo)
}

const handleForceRefresh = (repoInfo: RepoInfo) => {
  const url = buildRepoUrl(repoInfo)
  selectedRepoUrl.value = url
  startLoadStars({ ...repoInfo, forceRefresh: true })
  addRepo(repoInfo)
}

const handleClearInput = () => {
  clearCurrentRepoState()
}

const handleSelectHistory = (url: string) => {
  const repoInfo = getRepo(url)
  if (!repoInfo) return
  if (loading.value) {
    toast.add({ title: 'Loading... Please wait.', color: 'info' })
    return
  }
  if (gameover.value) {
    toast.add({ title: 'API limit reached. Try again later.', color: 'warning' })
    return
  }
  if (finished.value && repo.value && repo.value.owner === repoInfo.owner && repo.value.name === repoInfo.name) {
    toast.add({ title: 'This repo is up to date. Use “Force Refresh” to re-fetch.', color: 'success' })
    return
  }
  input.value = url
  selectedRepoUrl.value = url
  startLoadStars(repoInfo)
  addRepo(repoInfo)
}

const handleRemoveHistory = (url: string) => {
  if (!url) return
  removeRepo(url)
  const currentUrl = repo.value ? buildRepoUrl(repo.value) : ''
  const shouldClear = url === selectedRepoUrl.value || url === input.value || (currentUrl && currentUrl === url)
  if (shouldClear) {
    clearCurrentRepoState()
  }
}
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden selection:bg-zinc-500/30">
    <!-- Custom Glass Sidebar -->
    <aside
      class="hidden md:flex flex-col w-[280px] flex-shrink-0 bg-white/50 dark:bg-[#0B0C0E]/50 backdrop-blur-xl border-r border-zinc-200/50 dark:border-white/5 z-20 relative"
    >
      <div class="p-6 flex items-center gap-3">
        <div
          class="h-8 w-8 rounded-xl bg-[#24292f] shadow-lg shadow-zinc-500/20 flex items-center justify-center text-white font-bold text-sm"
        >
          S
        </div>
        <span class="font-bold text-lg tracking-tight text-zinc-800 dark:text-zinc-100"> Github Repo Analyze </span>
      </div>

      <!-- History List Container -->
      <div class="flex-1 overflow-y-auto px-4 pb-4">
        <RepoHistoryTree
          :history="history"
          :selected-url="selectedRepoUrl"
          @select="handleSelectHistory"
          @remove="handleRemoveHistory"
        />
      </div>

      <!-- Footer / Credits -->
      <div
        class="p-4 border-t border-zinc-200/50 dark:border-white/5 text-xs text-zinc-400 dark:text-zinc-600 text-center"
      >
        Powered by Nuxt & ECharts
      </div>
    </aside>

    <!-- Main Content Area - Floating Feel -->
    <main class="flex-1 flex flex-col min-w-0 relative bg-zinc-50 dark:bg-[#0B0C0E]">
      <!-- Top Decorative Mesh Gradient -->
      <div
        class="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-200/40 via-transparent to-transparent dark:from-zinc-800/20 dark:via-transparent dark:to-transparent pointer-events-none"
      />

      <!-- Search Header Region -->
      <div class="z-10 w-full max-w-5xl mx-auto px-6 pt-8 pb-4">
        <RepoHeader
          v-model="input"
          :loading="loading"
          :finished="finished"
          :gameover="gameover"
          :total="total"
          :current-repo="repo"
          @search="handleSearch"
          @force-refresh="handleForceRefresh"
          @clear="handleClearInput"
        />
      </div>

      <!-- Scrollable Dashboard Content -->
      <div class="flex-1 overflow-y-auto px-6 pb-20 scroll-smooth custom-scrollbar">
        <div class="max-w-5xl mx-auto">
          <TabsCharts :loading="loading" :data="data" :total="total" :repo="repo" :initial-tab="initialTab" />
        </div>
      </div>

      <!-- Overlays -->
      <LimitTip :left-count="remaining" :reset-date="resetDate" />
      <GameoverModal :gameover="gameover" :reset-date="resetDate" />
    </main>
  </div>
</template>
