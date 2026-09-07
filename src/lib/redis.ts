import { createClient } from 'redis'

type RedisClientType = ReturnType<typeof createClient>

declare const globalThis: {
  redisGlobal?: RedisClientType
} & typeof global

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

function createRedisClient(): RedisClientType {
  const client = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 5000,
      reconnectStrategy: (retries) => {
        if (retries > 5) {
          return new Error('Redis max reconnection retries reached')
        }
        return Math.min(retries * 100, 2000)
      },
    },
  })

  client.on('error', (err) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Redis] Connection issue:', err.message)
    }
  })

  return client
}

const redis = globalThis.redisGlobal ?? createRedisClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.redisGlobal = redis
}

export async function getRedis(): Promise<RedisClientType | null> {
  try {
    if (!redis.isOpen) {
      await redis.connect()
    }
    return redis
  } catch (error) {
    console.warn(
      '[Redis] Failed to connect, proceeding with graceful fallback:',
      (error as Error).message
    )
    return null
  }
}

export default redis
