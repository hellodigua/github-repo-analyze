<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { getChartData, getPercent, type DailyData } from '~/utils/chart'
import type { RepoInfo } from '~/utils/repo'

import { use } from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, ToolboxComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'

if (import.meta.client) {
  use([
    BarChart,
    LineChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    ToolboxComponent,
    DataZoomComponent,
    CanvasRenderer,
  ])
}

const props = defineProps<{
  loading: boolean
  data?: DailyData
  total?: number | null
  repo?: RepoInfo | null
  initialTab?: 'bar' | 'line' | 'area'
}>()

const activeTab = ref<'bar' | 'line'>('bar') // Now represents Daily Series Type
const showDaily = ref(true)
const showTotal = ref(true)

const chartData = computed(() => getChartData(props.data))
const percent = computed(() => getPercent(props.data, props.total ?? 0))
const categories = computed(() => chartData.value.map((item) => item.date))
const dailySeries = computed(() => chartData.value.map((item) => item.star))
const totalSeries = computed(() => chartData.value.map((item) => item.currTotal))

const combinedOption = computed(() => {
  const series = []

  if (showDaily.value) {
    series.push({
      name: 'Daily Stars',
      type: activeTab.value, // 'bar' or 'line'
      data: dailySeries.value,
      yAxisIndex: 0,
      itemStyle: { color: '#60a5fa' }, // Soft Blue
      areaStyle: activeTab.value === 'line' ? { opacity: 0.2, color: '#60a5fa' } : undefined,
      barMaxWidth: 20,
    })
  }

  if (showTotal.value) {
    series.push({
      name: 'Total Stars',
      type: 'line',
      data: totalSeries.value,
      yAxisIndex: 1,
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 3, color: '#818cf8' }, // Soft Indigo
      itemStyle: { color: '#818cf8' },
    })
  }

  return {
    tooltip: { trigger: 'axis' },
    legend: { show: true, top: 0 },
    grid: { left: 50, right: 50, top: 40, bottom: 80 },
    xAxis: {
      type: 'category',
      data: categories.value,
      axisLabel: { rotate: 45, color: '#a1a1aa' },
      axisLine: { lineStyle: { color: '#e4e4e7' } },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Daily',
        position: 'left',
        splitLine: { show: false },
        axisLabel: { color: '#60a5fa' },
        axisLine: { show: true, lineStyle: { color: '#60a5fa' } },
      },
      {
        type: 'value',
        name: 'Total',
        position: 'right',
        splitLine: { lineStyle: { type: 'dashed', color: '#e4e4e7', opacity: 0.5 } },
        axisLabel: { color: '#818cf8' }, // Soft Indigo
        axisLine: { show: true, lineStyle: { color: '#818cf8' } },
      },
    ],
    // 底部缩略图拖拽条：用于快速缩放与定位时间区间
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        filterMode: 'none',
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
        moveOnMouseWheel: true,
      },
      {
        type: 'slider',
        xAxisIndex: 0,
        height: 28,
        bottom: 10,
        showDataShadow: 'auto',
        brushSelect: false,
        showDetail: false,
        moveHandleSize: 0,
        filterMode: 'none',
        borderColor: 'transparent',
        backgroundColor: 'rgba(228, 228, 231, 0.45)',
        fillerColor: 'rgba(129, 140, 248, 0.25)',
        handleStyle: {
          color: '#ffffff',
          borderColor: '#a1a1aa',
          shadowBlur: 4,
          shadowColor: 'rgba(0,0,0,0.12)',
          shadowOffsetY: 2,
        },
        handleSize: '120%',
        textStyle: { color: '#71717a' },
      },
    ],
    series,
  }
})

const chartRef = ref<InstanceType<typeof VChart> | null>(null)

watch(
  () => props.initialTab,
  (val) => {
    if (val && (val === 'bar' || val === 'line')) activeTab.value = val
  }
)

const getActiveChart = () => {
  const refMap = chartRef.value
  if (!refMap) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (refMap as any).getEchartsInstance === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (refMap as any).getEchartsInstance()
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return refMap as any
}

// 下载图片与数据，复用 ECharts 的 getDataURL 能力
const handleDownload = () => {
  const chart = getActiveChart()
  if (!chart || !props.repo) return
  const dataUrl = chart.getDataURL?.({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  })
  if (!dataUrl) return

  const title = `${props.repo.owner}/${props.repo.name}`
  const a = document.createElement('a')
  a.download = `${title.replace('/', '.')}.star.chart.png`
  a.href = dataUrl
  a.click()

  const sourceData = props.data || {}
  const blob = new Blob([JSON.stringify(sourceData, null, 2)], { type: 'application/json' })
  const jsonUrl = URL.createObjectURL(blob)
  const b = document.createElement('a')
  b.download = `${title.replace('/', '.')}.star.data.json`
  b.href = jsonUrl
  b.click()
  URL.revokeObjectURL(jsonUrl)
}
</script>

<template>
  <div class="relative group">
    <!-- Main Card -->
    <div
      class="relative bg-white dark:bg-[#121214] rounded-2xl shadow-xl shadow-zinc-200/50 dark:shadow-black/50 border border-zinc-200/50 dark:border-white/5 p-6 backdrop-blur-sm transition-all duration-300"
    >
      <!-- Toolbar Header -->
      <div class="flex flex-col gap-6 mb-8 md:flex-row md:items-center md:justify-between">
        <!-- Floating Tabs -->
        <div
          class="inline-flex p-1 bg-zinc-100/80 dark:bg-white/5 rounded-xl border border-zinc-200/50 dark:border-white/5 backdrop-blur-md"
        >
          <button
            v-for="tab in ['bar', 'line'] as const"
            :key="tab"
            type="button"
            class="relative px-6 py-2 text-sm font-medium rounded-lg transition-all duration-300 capitalize z-10"
            :class="[
              activeTab === tab
                ? 'text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300',
            ]"
            @click="activeTab = tab"
          >
            <!-- Moving background for active tab -->
            <div
              v-if="activeTab === tab"
              class="absolute inset-0 bg-white dark:bg-zinc-800 rounded-lg -z-10 shadow-sm transition-all duration-300"
            ></div>
            {{ tab }}
          </button>
        </div>

        <!-- Controls -->
        <div class="flex flex-wrap items-center gap-6">
          <div
            class="flex items-center gap-4 bg-zinc-50 dark:bg-white/5 px-4 py-2 rounded-xl border border-zinc-100 dark:border-white/5"
          >
            <label
              class="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer select-none hover:text-[#24292f] dark:hover:text-zinc-200 transition-colors"
            >
              <input
                v-model="showDaily"
                type="checkbox"
                class="accent-[#24292f] w-4 h-4 rounded border-zinc-300 focus:ring-zinc-500"
              />
              Daily Trend
            </label>
            <div class="w-[1px] h-4 bg-zinc-200 dark:bg-white/10"></div>
            <label
              class="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer select-none hover:text-[#24292f] dark:hover:text-zinc-200 transition-colors"
            >
              <input
                v-model="showTotal"
                type="checkbox"
                class="accent-[#24292f] w-4 h-4 rounded border-zinc-300 focus:ring-zinc-500"
              />
              Total Growth
            </label>
          </div>

          <!-- Progress -->
          <div
            v-if="percent > 0 && percent < 100"
            class="flex items-center gap-3 bg-zinc-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-zinc-200/50 dark:border-white/5"
          >
            <span class="text-[10px] font-mono font-bold text-zinc-500">{{ percent }}%</span>
            <div class="w-16 h-1.5 bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                class="h-full bg-[#24292f] rounded-full transition-all duration-300"
                :style="{ width: `${percent}%` }"
              ></div>
            </div>
          </div>

          <button
            v-if="percent === 100"
            class="flex items-center gap-2 px-4 py-2 bg-[#24292f] dark:bg-white text-white dark:text-zinc-900 text-xs font-bold rounded-lg hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
            @click="handleDownload"
          >
            <UIcon name="i-heroicons-arrow-down-tray" class="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <!-- Chart Content Area -->
      <div
        class="relative min-h-[450px] w-full bg-zinc-50/50 dark:bg-black/20 rounded-xl border border-zinc-100 dark:border-white/5 overflow-hidden"
      >
        <!-- Grid Pattern Background -->
        <div
          class="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat"
        ></div>

        <!-- Loading State -->
        <div
          v-if="loading && !data"
          class="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-black/60 z-10 backdrop-blur-sm transition-all duration-500"
        >
          <div
            class="w-12 h-12 border-4 border-zinc-200 dark:border-zinc-800 border-t-[#24292f] dark:border-t-white rounded-full animate-spin mb-4"
          ></div>
          <span class="text-xs font-medium text-zinc-500 tracking-widest uppercase animate-pulse"
            >Analyzing Repository...</span
          >
        </div>

        <ChartPlaceholder v-if="!data && !loading" />

        <ClientOnly>
          <div v-if="data" class="h-[450px] md:h-[550px] w-full p-2">
            <VChart ref="chartRef" class="w-full h-full" :option="combinedOption" :autoresize="true" />
          </div>
        </ClientOnly>
      </div>
    </div>

    <!-- Decorative Blurs behind card -->
    <div
      class="absolute -inset-4 bg-gradient-to-r from-zinc-500/10 to-gray-500/10 rounded-[2rem] blur-2xl -z-10 opacity-0 dark:opacity-100 transition-opacity duration-1000 pointer-events-none"
    ></div>
  </div>
</template>
