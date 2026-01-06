const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('Creating technician profiles for users with TECHNICIAN role who lack one...')

    // Find users with TECHNICIAN role but no technician profile
    const usersWithoutProfile = await prisma.user.findMany({
        where: {
            role: 'TECHNICIAN',
            technician: null
        },
        select: { id: true, name: true, email: true }
    })

    console.log(`Found ${usersWithoutProfile.length} users needing technician profile`)

    for (const user of usersWithoutProfile) {
        console.log(`Creating technician profile for ${user.name} (${user.email})...`)

        await prisma.technician.create({
            data: {
                userId: user.id,
                experience: 1,
                bio: `Teknisi profesional ${user.name}`,
                specialties: ['Smartphone', 'Laptop'],
                rating: 0,
                totalReview: 0,
                isAvailable: true
            }
        })

        console.log(`Created profile for ${user.name}`)
    }

    console.log('Done!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
