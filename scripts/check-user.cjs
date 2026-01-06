const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.findFirst({
        where: { email: 'sketteknisi2@gmail.com' },
        include: { technician: true }
    })

    if (user) {
        console.log('User:', user.name)
        console.log('Role:', user.role)
        console.log('Has Technician Profile:', !!user.technician)
        console.log('Technician ID:', user.technician?.id || 'N/A')
    } else {
        console.log('User not found!')
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
