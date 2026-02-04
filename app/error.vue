<script setup lang="ts">
interface Props {
  error: {
    statusCode?: number
    statusMessage?: string
    message?: string
  }
}

const props = defineProps<Props>()

const statusCode = computed(() => props.error?.statusCode ?? 500)
const statusText = computed(() => props.error?.statusMessage || props.error?.message || 'Something went wrong')
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
    <div class="text-5xl font-semibold text-gray-900">{{ statusCode }}</div>
    <div class="text-base text-gray-600">{{ statusText }}</div>
    <button
      class="mt-2 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      @click="clearError({ redirect: '/' })"
    >
      Back to Home
    </button>
  </div>
</template>
