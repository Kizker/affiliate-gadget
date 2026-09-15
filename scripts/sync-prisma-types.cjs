const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma')
const tempSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.temp.prisma')

let schemaContent = fs.readFileSync(schemaPath, 'utf-8')
schemaContent = schemaContent.replace(
  'provider        = "prisma-client-js"',
  'provider        = "prisma-client-js"\n  output          = "../temp_client"'
)

fs.writeFileSync(tempSchemaPath, schemaContent, 'utf-8')

try {
  console.log('Running prisma generate on temp schema...')
  execSync('npx prisma generate --schema=prisma/schema.temp.prisma', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  })
  
  const tempDir = path.join(__dirname, '..', 'temp_client')
  console.log('temp_client files:', fs.readdirSync(tempDir))
  
  // Look in temp_client/index.d.ts for pricePerKg
  const tempIndexDts = fs.readFileSync(path.join(tempDir, 'index.d.ts'), 'utf-8')
  console.log('Does temp index.d.ts have pricePerKg?', tempIndexDts.includes('pricePerKg'))
  console.log('Does temp index.d.ts have totalWeightGram?', tempIndexDts.includes('totalWeightGram'))

  // Find all locations of .prisma/client in node_modules
  const copyToTarget = (targetDir) => {
    if (!fs.existsSync(targetDir)) return
    console.log('Copying to:', targetDir)
    const files = fs.readdirSync(tempDir)
    for (const file of files) {
      if (file.endsWith('.dll.node') || file.endsWith('.tmp')) continue
      const src = path.join(tempDir, file)
      const dst = path.join(targetDir, file)
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, dst)
      }
    }
  }

  // 1. node_modules/.prisma/client
  copyToTarget(path.join(__dirname, '..', 'node_modules', '.prisma', 'client'))
  
  // 2. node_modules/@prisma/client
  copyToTarget(path.join(__dirname, '..', 'node_modules', '@prisma', 'client'))

  // 3. .pnpm subdirectories
  const pnpmDir = path.join(__dirname, '..', 'node_modules', '.pnpm')
  if (fs.existsSync(pnpmDir)) {
    const entries = fs.readdirSync(pnpmDir)
    for (const entry of entries) {
      if (entry.includes('@prisma+client') || entry.includes('prisma')) {
        copyToTarget(path.join(pnpmDir, entry, 'node_modules', '.prisma', 'client'))
        copyToTarget(path.join(pnpmDir, entry, 'node_modules', '@prisma', 'client'))
      }
    }
  }

  console.log('Synchronization complete!')
} finally {
  if (fs.existsSync(tempSchemaPath)) {
    fs.unlinkSync(tempSchemaPath)
  }
  if (fs.existsSync(path.join(__dirname, '..', 'temp_client'))) {
    fs.rmSync(path.join(__dirname, '..', 'temp_client'), { recursive: true, force: true })
  }
}
