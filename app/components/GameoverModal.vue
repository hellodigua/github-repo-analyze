<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  gameover?: boolean
  resetDate?: string
}>()

const open = ref(false)

watch(
  () => props.gameover,
  (val) => {
    open.value = Boolean(val)
  },
  { immediate: true }
)
</script>

<template>
  <UModal v-model:open="open" prevent-close>
    <template #content>
      <div class="modal">
        <h3 class="title">Game Over!</h3>
        <p>Today API requests remaining is <span class="highlight">ZERO</span></p>
        <p>
          Renew at <span class="highlight">{{ resetDate }}</span> !
        </p>
        <ULink to="https://developer.github.com/v4/guides/resource-limitations/" target="_blank" class="link">
          More Info
        </ULink>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.modal {
  padding: 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2a44;
}

.highlight {
  color: #ef4444;
  font-weight: 700;
}

.link {
  font-size: 0.8rem;
  color: #2563eb;
}
</style>
