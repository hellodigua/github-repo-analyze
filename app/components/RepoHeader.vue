<script setup lang="ts">
import { computed } from 'vue'
import { getRepo, type RepoInfo } from '~/utils/repo'

const props = defineProps<{
  modelValue: string
  loading: boolean
  finished: boolean
  gameover?: boolean
  total: number | null
  currentRepo?: RepoInfo | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'search' | 'force-refresh', repo: RepoInfo): void
  (e: 'clear'): void
}>()

const toast = useToast()

const colorMode = useColorMode()
const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  },
})

const inputValue = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val),
})

const isSameRepo = (repo: RepoInfo | null) => {
  if (!repo || !props.currentRepo) return false
  return repo.owner === props.currentRepo.owner && repo.name === props.currentRepo.name
}

const handleSearch = () => {
  const repo = getRepo(inputValue.value)
  if (!inputValue.value) {
    toast.add({ title: 'Please enter a GitHub repo URL.', color: 'warning' })
    return
  }
  if (!repo) {
    toast.add({ title: 'Invalid URL. Please check.', color: 'warning' })
    return
  }
  if (props.loading) {
    toast.add({ title: 'Loading... Please wait.', color: 'info' })
    return
  }
  if (props.finished && isSameRepo(repo)) {
    toast.add({ title: 'This repo is up to date. Use “Force Refresh” to re-fetch.', color: 'success' })
    return
  }
  emit('search', repo)
}

const handleForceRefresh = () => {
  const repo = getRepo(inputValue.value)
  if (!inputValue.value) {
    toast.add({ title: 'Please enter a GitHub repo URL.', color: 'warning' })
    return
  }
  if (!repo) {
    toast.add({ title: 'Invalid URL. Please check.', color: 'warning' })
    return
  }
  emit('force-refresh', repo)
}

const handleClear = () => {
  inputValue.value = ''
  emit('clear')
}
</script>

<template>
  <header class="flex flex-col gap-6 md:flex-row md:items-start md:justify-between w-full h-[100px]">
    <!-- Search Area with Glow Effect -->
    <div class="flex-1 max-w-2xl relative group">
      <!-- Glow backing -->
      <div
        class="absolute -inset-1 bg-[#24292f] rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500 group-focus-within:opacity-25"
      ></div>

      <div
        class="relative flex items-center bg-white dark:bg-[#121214] rounded-xl p-2 shadow-sm border border-zinc-200/50 dark:border-white/10 ring-1 ring-transparent group-focus-within:ring-zinc-500/30 transition-all duration-300"
      >
        <!-- Icon -->
        <div class="pl-3 pr-2 text-zinc-400">
          <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5" />
        </div>

        <input
          v-model="inputValue"
          type="text"
          placeholder="Search GitHub repository (e.g. nuxt/nuxt)..."
          class="flex-1 bg-transparent border-none outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 text-sm h-10 px-2"
          :disabled="loading || gameover"
          @keyup.enter="handleSearch"
        />

        <!-- Actions inside input -->
        <div class="flex items-center gap-1 pr-1">
          <button
            v-if="inputValue"
            class="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
            @click="handleClear"
          >
            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
          </button>

          <div class="h-4 w-[1px] bg-zinc-200 dark:bg-white/10 mx-1"></div>

          <button
            class="px-4 py-1.5 bg-[#24292f] text-white text-sm font-medium rounded-lg shadow-lg shadow-zinc-500/10 hover:shadow-zinc-500/20 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="loading || gameover || !inputValue"
            @click="handleSearch"
          >
            <span v-if="loading" class="flex items-center gap-2">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              Searching
            </span>
            <span v-else>Analyze</span>
          </button>
        </div>
      </div>

      <!-- Helper text -->
      <div class="absolute top-full left-0 mt-2 px-1 text-[11px] text-zinc-400 dark:text-zinc-500">
        Press
        <span class="font-mono bg-zinc-100 dark:bg-white/10 px-1 rounded text-zinc-500 dark:text-zinc-400">Enter</span>
        to search
      </div>
    </div>

    <!-- Stats Display -->
    <div class="flex items-center gap-4 md:pt-2">
      <div v-if="total !== null" class="flex flex-col items-end animate-fade-in">
        <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5"> Total Stars </span>
        <div class="flex items-baseline gap-1">
          <span
            class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-zinc-800 to-zinc-500 dark:from-white dark:to-zinc-500 font-mono tracking-tight"
          >
            {{ total.toLocaleString() }}
          </span>
        </div>
      </div>

      <div v-if="total !== null" class="h-8 w-[1px] bg-zinc-200 dark:bg-white/10 mx-2"></div>

      <button
        class="group p-2 rounded-xl text-zinc-400 hover:text-[#24292f] hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-white/10 transition-all duration-200 relative overflow-hidden disabled:opacity-50"
        :disabled="loading || gameover"
        title="Force Refresh"
        @click="handleForceRefresh"
      >
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-5 h-5 transition-transform duration-500 ease-out group-hover:rotate-180"
          :class="{ 'animate-spin': loading }"
        />
      </button>

      <div class="h-8 w-[1px] bg-zinc-200 dark:bg-white/10 mx-2"></div>

      <button
        class="flex items-center justify-center p-2 rounded-xl text-zinc-400 hover:text-[#24292f] hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-white/10 transition-all duration-200"
        title="Toggle Theme"
        @click="isDark = !isDark"
      >
        <UIcon :name="isDark ? 'i-heroicons-moon' : 'i-heroicons-sun'" class="w-5 h-5" />
      </button>
    </div>
  </header>
</template>
```
