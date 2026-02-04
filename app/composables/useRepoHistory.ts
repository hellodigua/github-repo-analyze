import { ref, onMounted, computed } from 'vue'
import { buildRepoUrl, getRepo, type RepoInfo } from '~/utils/repo'

const STORAGE_KEY = 'LOCAL_REPO_HISTORY'
const MAX_ITEMS = 50

const readHistory = (): string[] => {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeHistory = (list: string[]) => {
  if (!import.meta.client) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export const useRepoHistory = () => {
  const history = ref<string[]>([])

  onMounted(() => {
    history.value = readHistory()
  })

  // 新增历史记录：去重（不改变现有顺序）、限制最大数量
  const addRepo = (repo: RepoInfo | null) => {
    if (!repo) return
    const url = buildRepoUrl(repo)

    // 如果已存在，不改变顺序（避免列表跳动），直接返回
    if (history.value.includes(url)) return

    const next = [url, ...history.value].slice(0, MAX_ITEMS)
    history.value = next
    writeHistory(next)
  }

  // 删除历史记录并同步本地存储
  const removeRepo = (url: string) => {
    if (!url) return
    const next = history.value.filter((item) => item !== url)
    history.value = next
    writeHistory(next)
  }

  const list = computed(() => history.value.filter((url) => getRepo(url)))

  return {
    history: list,
    addRepo,
    removeRepo,
  }
}
