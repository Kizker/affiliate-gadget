const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('Starting technician role migration...')

    // Use raw SQL to update users who have a technician profile to TECHNICIAN role
    const result = await prisma.$executeRawUnsafe(`
    UPDATE "users" 
    SET "role" = 'TECHNICIAN' 
    WHERE "id" IN (
      SELECT "userId" FROM "technicians"
    )
    AND "role" = 'CUSTOMER'
  `)

    console.log('Migration completed!')
    console.log('Updated', result, 'users to TECHNICIAN role')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
