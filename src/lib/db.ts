import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  let dbUrl = process.env.DATABASE_URL || ''

  // Batasi pool koneksi agar tidak melebihi batas PostgreSQL lokal / serverless
  if (!dbUrl.includes('connection_limit')) {
    const separator = dbUrl.includes('?') ? '&' : '?'
    dbUrl = `${dbUrl}${separator}connection_limit=5&pool_timeout=20&connect_timeout=10`
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
  prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined
} & typeof global

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export const db = prisma
export default prisma

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
}
