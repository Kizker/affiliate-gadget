const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function createAdmin() {
    try {
        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10)

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                email: 'admin@affiliategadget.com',
                name: 'Admin Affiliate Gadget',
                password: hashedPassword,
                role: 'ADMIN',
                phone: '081234567890',
                address: 'Jl. Admin No. 1, Jakarta',
            },
        })

        console.log('\n✅ Admin user created successfully!')
        console.log('Email:', admin.email)
        console.log('Password: admin123')
        console.log('Role:', admin.role)
        console.log('\nYou can now login with these credentials.')

    } catch (error) {
        if (error.code === 'P2002') {
            console.log('\n⚠️  Admin user already exists!')

            // Update existing user to admin
            const updated = await prisma.user.update({
                where: { email: 'admin@affiliategadget.com' },
                data: { role: 'ADMIN' },
            })

            console.log('Updated user to ADMIN role:', updated.email)
        } else {
            console.error('Error:', error)
        }
    } finally {
        await prisma.$disconnect()
    }
}

createAdmin()
