import { useRuntimeConfig } from '#imports'

export class GitHubRequestError extends Error {
  status: number
  documentationUrl?: string

  constructor(status: number, message: string, documentationUrl?: string) {
    super(message)
    this.status = status
    this.documentationUrl = documentationUrl
  }
}

export const STAR_ACCEPT = 'application/vnd.github.star+json'
export const TOKEN_STORAGE_KEY = 'GITHUB_TOKEN'

const DEFAULT_ACCEPT = 'application/vnd.github+json'

const getStoredToken = () => {
  if (!import.meta.client) return ''
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

const getBaseUrl = () => {
  const config = useRuntimeConfig()
  return config.public?.githubApiBase || config.githubApiBase || 'https://api.github.com'
}

const buildUrl = (path: string, params?: Record<string, string>) => {
  const url = path.startsWith('http') ? new URL(path) : new URL(path, getBaseUrl())
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }
  return url.toString()
}

const resolveToken = (explicitToken?: string) => {
  const config = useRuntimeConfig()
  const runtimeToken = config.public?.githubToken || config.githubToken || ''
  const storedToken = getStoredToken()
  return (explicitToken || storedToken || runtimeToken).trim()
}

export const getNextPageUrl = (linkHeader: string | null): string | null => {
  if (!linkHeader) return null
  const segments = linkHeader.split(',')
  for (const segment of segments) {
    const [rawUrl, rawRel] = segment.split(';').map((part) => part.trim())
    if (!rawUrl || !rawRel) continue
    if (rawRel.includes('rel="next"')) {
      const match = /<([^>]+)>/.exec(rawUrl)
      return match?.[1] || null
    }
  }
  return null
}

export const githubRequest = async <T>(
  path: string,
  options?: {
    token?: string
    accept?: string
    params?: Record<string, string>
    method?: string
  }
): Promise<{ data: T; headers: Headers }> => {
  // 统一处理 REST 请求、鉴权与错误信息，避免各处重复拼装逻辑
  const url = buildUrl(path, options?.params)
  const headers: HeadersInit = {
    Accept: options?.accept || DEFAULT_ACCEPT,
  }
  const token = resolveToken(options?.token)
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    method: options?.method || 'GET',
    headers,
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json().catch(() => null) : null

  if (!response.ok) {
    const message = payload?.message || response.statusText || 'Request failed'
    const documentationUrl = payload?.documentation_url
    throw new GitHubRequestError(response.status, message, documentationUrl)
  }

  return { data: payload as T, headers: response.headers }
}
