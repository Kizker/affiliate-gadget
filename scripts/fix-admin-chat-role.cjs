const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('Fixing users with ADMIN_CHAT role...')

    // Find users with ADMIN_CHAT role and update to ADMIN using raw SQL
    const result = await prisma.$executeRawUnsafe(`UPDATE "users" SET "role" = 'ADMIN' WHERE "role" = 'ADMIN_CHAT'`)

    console.log('Updated users from ADMIN_CHAT to ADMIN:', result)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
