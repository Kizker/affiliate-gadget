// Script to transfer data from local Docker database to Neon production
const { PrismaClient } = require('@prisma/client')

// Local database client
const localPrisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://postgres:postgres@localhost:5432/halotekno'
        }
    }
})

// Production database client  
const prodPrisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://neondb_owner:npg_A1RSuEpmTU2q@ep-autumn-frost-a1cu3c3n-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
        }
    }
})

async function safeTransfer(modelName, localModel, prodModel, uniqueField = 'id') {
    console.log(`\n📦 Transferring ${modelName}...`)
    try {
        const items = await localModel.findMany()
        console.log(`Found ${items.length} ${modelName}`)

        let success = 0, failed = 0
        for (const item of items) {
            try {
                const whereClause = { [uniqueField]: item[uniqueField] }
                await prodModel.upsert({
                    where: whereClause,
                    update: item,
                    create: item
                })
                success++
            } catch (e) {
                failed++
                // Only log first few errors
                if (failed <= 3) {
                    console.log(`  ❌ ${item[uniqueField] || 'unknown'}: ${e.message.substring(0, 100)}`)
                }
            }
        }
        console.log(`✅ ${modelName}: ${success} success, ${failed} failed`)
    } catch (e) {
        console.log(`⚠️ Skipping ${modelName}: ${e.message.substring(0, 100)}`)
    }
}

async function transferData() {
    console.log('🚀 Starting data transfer from local to production...\n')

    try {
        // Core entities first (no dependencies)
        await safeTransfer('users', localPrisma.user, prodPrisma.user)
        await safeTransfer('accounts', localPrisma.account, prodPrisma.account)
        await safeTransfer('sessions', localPrisma.session, prodPrisma.session, 'sessionToken')

        // User-related entities
        await safeTransfer('technicians', localPrisma.technician, prodPrisma.technician)
        await safeTransfer('mitra', localPrisma.mitra, prodPrisma.mitra)
        await safeTransfer('addresses', localPrisma.address, prodPrisma.address)

        // Products and inventory
        await safeTransfer('categories', localPrisma.category, prodPrisma.category)
        await safeTransfer('products', localPrisma.product, prodPrisma.product)
        await safeTransfer('rentalItems', localPrisma.rentalItem, prodPrisma.rentalItem)
        await safeTransfer('services', localPrisma.service, prodPrisma.service)

        // Orders and transactions
        await safeTransfer('orders', localPrisma.order, prodPrisma.order)
        await safeTransfer('orderItems', localPrisma.orderItem, prodPrisma.orderItem)
        await safeTransfer('reviews', localPrisma.review, prodPrisma.review)
        await safeTransfer('wishlist', localPrisma.wishlist, prodPrisma.wishlist)

        // Content
        await safeTransfer('blogPosts', localPrisma.blogPost, prodPrisma.blogPost)

        // Chat (technician)
        await safeTransfer('chatRooms', localPrisma.chatRoom, prodPrisma.chatRoom)
        await safeTransfer('chatMessages', localPrisma.chatMessage, prodPrisma.chatMessage)

        // Chat (admin)
        await safeTransfer('adminChatRooms', localPrisma.adminChatRoom, prodPrisma.adminChatRoom)
        await safeTransfer('adminChatMessages', localPrisma.adminChatMessage, prodPrisma.adminChatMessage)

        // Notifications
        await safeTransfer('notifications', localPrisma.notification, prodPrisma.notification)

        console.log('\n🎉 Data transfer completed!')

    } catch (error) {
        console.error('💥 Fatal error during transfer:', error)
    } finally {
        await localPrisma.$disconnect()
        await prodPrisma.$disconnect()
    }
}

transferData()
