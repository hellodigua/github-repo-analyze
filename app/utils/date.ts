// 使用本地时区生成 YYYY-MM-DD 作为统计 key，避免 locale 造成格式差异
export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
