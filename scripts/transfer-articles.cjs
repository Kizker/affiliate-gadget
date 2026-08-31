const { PrismaClient } = require('@prisma/client')

const local = new PrismaClient({
    datasources: { db: { url: 'postgresql://postgres:postgres@localhost:5432/affiliate_gadget' } }
})

const prod = new PrismaClient({
    datasources: { db: { url: 'postgresql://neondb_owner:npg_A1RSuEpmTU2q@ep-autumn-frost-a1cu3c3n-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' } }
})

async function transferArticles() {
    console.log('📝 Transferring articles to production...')

    try {
        const articles = await local.article.findMany()
        console.log(`Found ${articles.length} articles`)

        let success = 0, failed = 0
        for (const article of articles) {
            try {
                await prod.article.upsert({
                    where: { id: article.id },
                    update: article,
                    create: article
                })
                success++
                process.stdout.write('.')
            } catch (e) {
                failed++
                console.log(`\n❌ ${article.slug || article.id}: ${e.message.substring(0, 80)}`)
            }
        }

        console.log(`\n✅ Articles: ${success} success, ${failed} failed`)
    } catch (error) {
        console.error('Error:', error.message)
    } finally {
        await local.$disconnect()
        await prod.$disconnect()
    }
}

transferArticles()
