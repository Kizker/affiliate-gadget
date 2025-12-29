import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixTechnicianData() {
  console.log('🔍 Checking for technicians with data issues...\n')

  try {
    // Find all technicians
    const technicians = await prisma.technician.findMany({
      include: {
        user: true,
        services: true,
      },
    })

    console.log(`📊 Total technicians found: ${technicians.length}\n`)

    let issuesFound = 0
    const problematicTechnicians = []

    for (const tech of technicians) {
      const issues = []

      // Check if user exists
      if (!tech.user) {
        issues.push('❌ No associated user')
      } else {
        // Check if user has name
        if (!tech.user.name) {
          issues.push('⚠️  User has no name')
        }

        // Check if user is inactive
        if (!tech.user.isActive) {
          issues.push('⚠️  User is inactive')
        }
      }

      // Check if specialties is empty
      if (!tech.specialties || tech.specialties.length === 0) {
        issues.push('⚠️  No specialties defined')
      }

      // Check if has no services
      if (!tech.services || tech.services.length === 0) {
        issues.push('⚠️  No services defined')
      }

      if (issues.length > 0) {
        issuesFound++
        problematicTechnicians.push({
          id: tech.id,
          userId: tech.userId,
          userName: tech.user?.name || 'N/A',
          userEmail: tech.user?.email || 'N/A',
          issues,
        })

        console.log(`\n🔴 Technician ID: ${tech.id}`)
        console.log(
          `   User: ${tech.user?.name || 'N/A'} (${tech.user?.email || 'N/A'})`
        )
        issues.forEach((issue) => console.log(`   ${issue}`))
      }
    }

    console.log(`\n\n📋 Summary:`)
    console.log(
      `   ✅ Healthy technicians: ${technicians.length - issuesFound}`
    )
    console.log(`   ⚠️  Technicians with issues: ${issuesFound}`)

    if (issuesFound > 0) {
      console.log('\n\n💡 Recommendations:')
      console.log('   1. Fix missing user data via Prisma Studio')
      console.log('   2. Set default names for users without names')
      console.log('   3. Add specialties and services for incomplete profiles')
      console.log(
        '   4. Consider deactivating technicians with critical issues'
      )

      console.log('\n\n🔧 Problematic Technicians Details:')
      console.table(
        problematicTechnicians.map((t) => ({
          ID: t.id.substring(0, 8) + '...',
          Name: t.userName,
          Email: t.userEmail,
          Issues: t.issues.length,
        }))
      )
    } else {
      console.log('\n✨ All technicians have valid data!')
    }
  } catch (error) {
    console.error('❌ Error checking technician data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
fixTechnicianData()
  .then(() => {
    console.log('\n✅ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
