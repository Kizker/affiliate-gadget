const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('Fixing newly created technicians that are missing technician profiles...')

    // Find users with TECHNICIAN role but no technician profile
    const usersNeedingProfile = await prisma.user.findMany({
        where: {
            role: 'TECHNICIAN',
            technician: null
        },
        select: { id: true, name: true, email: true }
    })

    console.log(`Found ${usersNeedingProfile.length} TECHNICIAN users without profile`)

    for (const user of usersNeedingProfile) {
        console.log(`Creating profile for ${user.name} (${user.email})...`)

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
        console.log(`Created!`)
    }

    // Also find users who were assigned ADMIN but were meant to be technicians
    // (they would have technician profile but ADMIN role)
    const adminWithTechProfile = await prisma.user.findMany({
        where: {
            role: 'ADMIN',
            technician: { isNot: null }
        },
        select: { id: true, name: true, email: true }
    })

    console.log(`\nFound ${adminWithTechProfile.length} ADMIN users with technician profile`)

    for (const user of adminWithTechProfile) {
        console.log(`Updating ${user.name} (${user.email}) to TECHNICIAN role...`)
        await prisma.user.update({
            where: { id: user.id },
            data: { role: 'TECHNICIAN' }
        })
    }

    console.log('\nDone!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
