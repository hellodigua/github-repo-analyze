export interface RepoInfo {
  owner: string
  name: string
}

export const buildRepoUrl = (repo: RepoInfo): string =>
  `https://github.com/${repo.owner}/${repo.name}`

export const getRepo = (input = ''): RepoInfo | null => {
  const value = input.trim()
  if (!value) return null

  // 优先按 URL 解析，支持 https://github.com/owner/name 或 github.com/owner/name
  const parseUrl = (raw: string): RepoInfo | null => {
    try {
      const parsed = new URL(raw)
      const isOrigin = parsed.host === 'github.com'
      const isHttp = parsed.protocol.startsWith('http')
      const parts = parsed.pathname.split('/').filter(Boolean)
      const [owner = '', name = ''] = parts
      if (isOrigin && isHttp && owner && name && parts.length === 2) {
        return { owner, name }
      }
    } catch (error) {
      return null
    }
    return null
  }

  if (value.includes('github.com')) {
    return parseUrl(value.startsWith('http') ? value : `https://${value}`)
  }

  // 兼容 owner/name 形式
  const segments = value.replace(/^\/+|\/+$/g, '').split('/')
  if (segments.length === 2 && segments[0] && segments[1]) {
    return { owner: segments[0], name: segments[1] }
  }

  return null
}
