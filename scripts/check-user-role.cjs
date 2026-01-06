const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.findFirst({
        where: { email: 'sketteknisi@gmail.com' },
        include: {
            technician: true
        }
    })

    console.log('User:', user?.name, user?.email)
    console.log('Has technician profile:', !!user?.technician)
    console.log('Technician data:', user?.technician)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
