import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  // Optimize database URL for serverless
  let dbUrl = process.env.DATABASE_URL || ''

  // Add connection pooling params for Neon serverless
  // Use lower connection limit to prevent "too many clients" during build
  if (dbUrl.includes('neon.tech') && !dbUrl.includes('connection_limit')) {
    const separator = dbUrl.includes('?') ? '&' : '?'
    dbUrl = `${dbUrl}${separator}connection_limit=3&pool_timeout=30&connect_timeout=15`
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>
  prismaSchemaVersion: number
} & typeof global

const CURRENT_SCHEMA_VERSION = 5

// Ensure the cached singleton is refreshed if models or fields are missing/outdated
const isOutdatedSingleton =
  globalThis.prismaGlobal &&
  (globalThis.prismaSchemaVersion !== CURRENT_SCHEMA_VERSION ||
    !(globalThis.prismaGlobal as any).storeWithdrawal ||
    !('heroImage' in ((globalThis.prismaGlobal as any).store?.fields || {})))

const prisma =
  !globalThis.prismaGlobal || isOutdatedSingleton
    ? prismaClientSingleton()
    : globalThis.prismaGlobal

export const db = prisma
export default prisma

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
  globalThis.prismaSchemaVersion = CURRENT_SCHEMA_VERSION
}
