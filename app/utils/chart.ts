export type DailyData = Record<string, { count: number }>

export interface ChartItem {
  date: string
  star: number
  currTotal: number
}

// 解析 YYYY-MM-DD 为本地日期，避免时区偏移导致天数错位
const parseDateKey = (dateKey: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

// 生成起止日期（含首尾）的完整日期序列，保证缺失天数补 0
const buildDateRange = (start: Date, end: Date): string[] => {
  const result: string[] = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  while (cursor <= last) {
    result.push(formatDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return result
}

export const getChartData = (data?: DailyData | null): ChartItem[] => {
  if (!data) return []
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b))
  if (!entries.length) return []

  const startDate = parseDateKey(entries[0][0])
  const endDate = parseDateKey(entries[entries.length - 1][0])
  const dateKeys =
    startDate && endDate ? buildDateRange(startDate, endDate) : entries.map(([date]) => date)

  const chartData = dateKeys.map((date) => ({
    date,
    star: data[date]?.count ?? 0,
    currTotal: 0,
  }))

  // 计算累计值，方便图表展示总量走势
  chartData.reduce((acc, curr, idx, arr) => {
    arr[idx].currTotal = acc + curr.star
    return acc + curr.star
  }, 0)

  return chartData
}

export const getPercent = (data?: DailyData | null, total?: number | null): number => {
  if (!data || !total) return 0
  const sum = Object.values(data).reduce((prev, curr) => prev + (curr?.count || 0), 0)
  return total === 0 ? 0 : Math.floor((sum / total) * 100)
}
