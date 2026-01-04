import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  // Optimize database URL for serverless
  let dbUrl = process.env.DATABASE_URL || ''

  // Add connection pooling params for Neon serverless
  if (dbUrl.includes('neon.tech') && !dbUrl.includes('connection_limit')) {
    const separator = dbUrl.includes('?') ? '&' : '?'
    // Increase connection limit for build time, use pool timeout
    dbUrl = `${dbUrl}${separator}connection_limit=10&pool_timeout=20&connect_timeout=10`
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
} & typeof global

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export const db = prisma
export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
