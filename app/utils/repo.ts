export interface RepoInfo {
  owner: string
  name: string
}

export const buildRepoUrl = (repo: RepoInfo): string =>
  `https://github.com/${repo.owner}/${repo.name}`

export const getRepo = (url = ''): RepoInfo | null => {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const isOrigin = parsed.host === 'github.com'
    const isHttp = parsed.protocol.includes('http')
    const parts = parsed.pathname.split('/')
    const isPath = parts.length === 3
    const [, owner = '', name = ''] = parts
    const isFull = Boolean(owner && name)
    if (isOrigin && isHttp && isPath && isFull) {
      return { owner, name }
    }
  } catch (error) {
    return null
  }

  return null
}
