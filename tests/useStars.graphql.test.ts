import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useStars } from '~/composables/useStars'
import { mockRuntimeConfig } from './mocks/nuxt-imports'

const jsonResponse = (payload: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(payload), {
    status: init?.status || 200,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers || {}),
    },
  })

describe('useStars GraphQL loader', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockRuntimeConfig.githubToken = 'test-token'
    mockRuntimeConfig.public.githubToken = ''
  })

  it('loads starredAt history through GitHub GraphQL cursor pages', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url !== 'https://api.github.com/graphql') {
        return jsonResponse({ message: 'Not Found', status: '404' }, { status: 404 })
      }

      const body = JSON.parse(String(init?.body || '{}'))
      if (!body.variables?.cursor) {
        return jsonResponse({
          data: {
            repository: {
              stargazers: {
                edges: [{ starredAt: '2025-12-22T13:06:49Z' }, { starredAt: '2025-12-22T14:06:49Z' }],
                pageInfo: {
                  hasNextPage: true,
                  endCursor: 'cursor-1',
                },
              },
            },
          },
        })
      }

      return jsonResponse({
        data: {
          repository: {
            stargazers: {
              edges: [{ starredAt: '2025-12-23T13:06:49Z' }],
              pageInfo: {
                hasNextPage: false,
                endCursor: 'cursor-2',
              },
            },
          },
        },
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const stars = useStars()
    await stars.startLoadStars({ owner: 'ChatLab', name: 'ChatLab' })

    expect(stars.error.value).toBeNull()
    expect(stars.finished.value).toBe(true)
    expect(stars.data.value).toEqual({
      '2025-12-22': { count: 2 },
      '2025-12-23': { count: 1 },
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls.every(([url]) => String(url) === 'https://api.github.com/graphql')).toBe(true)
  })

  it('uses fresh local cache without requesting GitHub again', async () => {
    localStorage.setItem(
      'LOCAL_REPO_CACHE:chatlab/chatlab',
      JSON.stringify({
        version: 6,
        lastCursor: 'cursor-2',
        cachedAt: Date.now(),
        daily: {
          '2025-12-22': { count: 2 },
        },
      })
    )
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const stars = useStars()
    await stars.startLoadStars({ owner: 'ChatLab', name: 'ChatLab' })

    expect(stars.error.value).toBeNull()
    expect(stars.finished.value).toBe(true)
    expect(stars.loading.value).toBe(false)
    expect(stars.data.value).toEqual({
      '2025-12-22': { count: 2 },
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
