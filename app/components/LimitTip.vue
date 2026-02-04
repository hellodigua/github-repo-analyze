<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'

const props = defineProps<{
  leftCount: number
  resetDate?: string
}>()

const visible = ref(true)
let timer: ReturnType<typeof setTimeout> | null = null

// 自动隐藏提示，避免长时间遮挡页面
watch(
  () => props.leftCount,
  (val) => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (val) {
      visible.value = true
      timer = setTimeout(() => {
        visible.value = false
      }, 4000)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <div v-if="leftCount && visible" class="limit-tip">
    <div class="tip">
      <span class="title">API Remaining</span>
      <span class="value">{{ leftCount }}</span>
    </div>
    <div class="tip">
      <span class="title">Reset Date Time</span>
      <span class="value">{{ resetDate }}</span>
    </div>
  </div>
</template>

<style scoped>
.limit-tip {
  position: fixed;
  right: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
  padding: 0.5rem 0.6rem;
  font-size: 0.75rem;
  color: #fff;
  background: rgba(20, 24, 31, 0.82);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 20;
}

.tip {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.title {
  color: #b8c0cc;
  font-size: 0.6rem;
}

.value {
  color: #fff;
}

@media (max-width: 900px) {
  .limit-tip {
    right: 0.3rem;
  }
}
</style>
