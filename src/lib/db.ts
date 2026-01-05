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
} & typeof global

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export const db = prisma
export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
