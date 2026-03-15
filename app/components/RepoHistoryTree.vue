<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { getRepo } from '~/utils/repo'

interface RepoItem {
  owner: string
  name: string
  url: string
}

const props = defineProps<{
  history: string[]
  selectedUrl?: string
}>()

const emit = defineEmits<{
  (e: 'select' | 'remove', url: string): void
  (e: 'reorder', urls: string[]): void
}>()

const toRepoItems = (urls: string[]): RepoItem[] =>
  urls
    .map((url) => {
      const repo = getRepo(url)
      if (!repo) return null
      return { owner: repo.owner, name: repo.name, url }
    })
    .filter((item): item is RepoItem => !!item)

const localItems = ref<RepoItem[]>(toRepoItems(props.history))

watch(
  () => props.history,
  (urls) => {
    localItems.value = toRepoItems(urls)
  }
)

const handleDragEnd = () => {
  emit(
    'reorder',
    localItems.value.map((item) => item.url)
  )
}

const handleSelect = (url: string) => {
  emit('select', url)
}

const handleRemove = (event: MouseEvent, url: string) => {
  event.stopPropagation()
  emit('remove', url)
}
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <div class="flex items-center justify-between mb-6 px-2">
      <h2 class="text-[11px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Recent History</h2>
      <span
        class="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-medium text-zinc-600 bg-zinc-100 dark:text-zinc-300 dark:bg-white/10 rounded-full ring-1 ring-inset ring-zinc-500/20"
      >
        {{ history.length }}
      </span>
    </div>

    <VueDraggable
      v-if="localItems.length"
      v-model="localItems"
      class="flex-1 space-y-1 px-1 custom-scrollbar overflow-y-auto"
      handle=".drag-handle"
      animation:150
      ghost-class="opacity-30"
      @end="handleDragEnd"
    >
      <button
        v-for="item in localItems"
        :key="item.url"
        type="button"
        class="group w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all duration-200 border border-transparent"
        :class="[
          item.url === selectedUrl
            ? 'bg-white dark:bg-white/5 shadow-sm border-zinc-200/50 dark:border-white/5 text-zinc-900 dark:text-zinc-100'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-white/[0.02] hover:text-zinc-900 dark:hover:text-zinc-200',
        ]"
        @click="handleSelect(item.url)"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <!-- Drag Handle -->
          <div
            class="drag-handle flex-shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-zinc-400"
          >
            <UIcon name="i-heroicons-bars-2" class="w-3.5 h-3.5" />
          </div>
          <img
            :src="`https://github.com/${item.owner}.png`"
            class="w-5 h-5 rounded-full opacity-80 transition-all"
            alt=""
          />
          <div class="flex flex-col items-start min-w-0">
            <span class="truncate font-medium text-[13px] leading-tight">{{ item.name }}</span>
            <span class="truncate text-[10px] text-zinc-400 group-hover:text-zinc-500 transition-colors">{{
              item.owner
            }}</span>
          </div>
        </div>

        <div
          class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-md text-zinc-400 hover:text-red-500 flex-shrink-0 ml-2"
          @click.stop="handleRemove($event, item.url)"
        >
          <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
        </div>
      </button>
    </VueDraggable>

    <div v-else class="flex flex-col items-center justify-center flex-1 text-zinc-400 dark:text-zinc-600 text-xs gap-3">
      <div class="w-12 h-12 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center">
        <UIcon name="i-heroicons-clock" class="w-5 h-5 opacity-40" />
      </div>
      <p>No projects yet</p>
    </div>
  </div>
</template>
