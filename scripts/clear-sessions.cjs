const { PrismaClient } = require('@prisma/client')

// Script to clear all sessions for a user
async function main() {
    const prisma = new PrismaClient()

    try {
        // Delete all sessions for the test user
        const result = await prisma.session.deleteMany({
            where: {
                user: {
                    email: {
                        in: ['sketteknisi@gmail.com', 'sketteknisi2@gmail.com']
                    }
                }
            }
        })

        console.log(`Deleted ${result.count} sessions`)

        // Also let's see how many sessions exist in total
        const totalSessions = await prisma.session.count()
        console.log(`Total sessions remaining: ${totalSessions}`)

    } catch (error) {
        console.error('Error:', error.message)
    } finally {
        await prisma.$disconnect()
    }
}

main()
