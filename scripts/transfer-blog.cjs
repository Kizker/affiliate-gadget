const { PrismaClient } = require('@prisma/client')

const local = new PrismaClient({
    datasources: { db: { url: 'postgresql://postgres:postgres@localhost:5432/halotekno' } }
})

const prod = new PrismaClient({
    datasources: { db: { url: 'postgresql://neondb_owner:npg_A1RSuEpmTU2q@ep-autumn-frost-a1cu3c3n-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } }
})

async function transferBlogPosts() {
    console.log('📝 Transferring blog posts to production...')

    try {
        const posts = await local.blogPost.findMany()
        console.log(`Found ${posts.length} blog posts`)

        let success = 0, failed = 0
        for (const post of posts) {
            try {
                await prod.blogPost.upsert({
                    where: { id: post.id },
                    update: post,
                    create: post
                })
                success++
                process.stdout.write('.')
            } catch (e) {
                failed++
                console.log(`\n❌ ${post.slug}: ${e.message.substring(0, 80)}`)
            }
        }

        console.log(`\n✅ Blog posts: ${success} success, ${failed} failed`)
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await local.$disconnect()
        await prod.$disconnect()
    }
}

transferBlogPosts()
