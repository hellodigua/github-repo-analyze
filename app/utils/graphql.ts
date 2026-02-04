import { GraphQLClient } from 'graphql-request'
import { useRuntimeConfig } from '#imports'

type Variables = Record<string, unknown>

// 统一的 GraphQL 请求封装，集中处理 endpoint 与鉴权
export async function gqlRequest<T>(query: string, variables?: Variables): Promise<T> {
  const config = useRuntimeConfig()
  const endpoint =
    config.public?.githubGraphqlUrl ||
    config.githubGraphqlUrl ||
    'https://api.github.com/graphql'
  const token = config.githubToken || config.public?.githubToken || ''
  const client = new GraphQLClient(endpoint, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  })

  return client.request<T>(query, variables)
}
