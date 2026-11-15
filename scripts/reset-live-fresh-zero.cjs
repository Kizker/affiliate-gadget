const { Client } = require('ssh2')

const conn = new Client()

const config = {
  host: '187.77.112.3',
  port: 22,
  username: 'root',
  password: '@Dea20031802',
  keepaliveInterval: 10000,
  keepaliveCountMax: 30,
  readyTimeout: 300000,
}

function runRemoteCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`\n>>> Executing on VPS: ${command}\n`)
    conn.exec(command, (err, stream) => {
      if (err) return reject(err)
      let output = ''
      stream
        .on('close', (code, signal) => {
          if (code !== 0) {
            console.error(`Command failed with code ${code}`)
            return reject(new Error(`Exit code ${code}`))
          }
          resolve(output)
        })
        .on('data', (data) => {
          process.stdout.write(data)
          output += data.toString()
        })
        .stderr.on('data', (data) => {
          process.stderr.write(data)
        })
    })
  })
}

async function main() {
  conn.on('ready', async () => {
    console.log('Connected to Hostinger VPS successfully.')
    try {
      // 1. Pull latest code from GitHub
      await runRemoteCommand('cd /opt/affiliate-gadget && git fetch origin main && git reset --hard origin/main')

      // 2. Drop and recreate public schema in Postgres
      console.log('\n--- Dropping and recreating public schema in PostgreSQL ---')
      await runRemoteCommand(`docker exec -i affiliate-gadget-db psql -U agadget -d affiliate_gadget -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO agadget; GRANT ALL ON SCHEMA public TO public;"`)

      // 3. Re-push Prisma Schema to generate all clean tables
      console.log('\n--- Recreating all tables from Prisma schema ---')
      await runRemoteCommand(`docker run --rm \\
        --network affiliate_gadget_network \\
        -v /opt/affiliate-gadget:/app \\
        -w /app \\
        -e DATABASE_URL="postgresql://agadget:AgProd2026Secure@postgres:5432/affiliate_gadget?schema=public" \\
        node:22-alpine \\
        sh -c "apk add --no-cache openssl && npx prisma@6.19.1 db push --schema=./prisma/schema.prisma --accept-data-loss"`)

      // 4. Seed ONLY the single Super Admin account
      console.log('\n--- Seeding single Super Admin account ---')
      await runRemoteCommand(`docker run --rm \\
        --network affiliate_gadget_network \\
        -v /opt/affiliate-gadget:/app \\
        -w /app \\
        -e DATABASE_URL="postgresql://agadget:AgProd2026Secure@postgres:5432/affiliate_gadget?schema=public" \\
        node:22-alpine \\
        sh -c "npx tsx scripts/seed-only-superadmin.ts"`)

      // 5. Clean local json files & temporary uploads
      console.log('\n--- Cleaning local data caches & temporary upload files ---')
      await runRemoteCommand(`sh -c '
        cd /opt/affiliate-gadget
        mkdir -p .data
        echo "{}" > .data/shipping-store.json
        echo "[]" > .data/store-withdrawals.json
        echo "{}" > .data/two-factor-store.json
        find public/uploads -type f ! -name ".gitkeep" -delete 2>/dev/null || true
      '`)

      // 6. Check counts to verify everything is 0 except 1 Superadmin user
      console.log('\n--- Verifying final DB count ---')
      await runRemoteCommand(`docker run --rm \\
        --network affiliate_gadget_network \\
        -v /opt/affiliate-gadget:/app \\
        -w /app \\
        -e DATABASE_URL="postgresql://agadget:AgProd2026Secure@postgres:5432/affiliate_gadget?schema=public" \\
        node:22-alpine \\
        sh -c "npx tsx prisma/check-counts.ts"`)

      // 7. Restart app, ws-server, and nginx
      console.log('\n--- Restarting app containers ---')
      await runRemoteCommand('cd /opt/affiliate-gadget && docker compose restart app ws-server nginx')

      // 8. Verify container status and HTTP response
      await runRemoteCommand('cd /opt/affiliate-gadget && docker compose ps')
      const httpCode = await runRemoteCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000')
      console.log(`\nLocal HTTP Response Code: ${httpCode.trim()}`)

      console.log('\n🎉 RESET TOTAL SELESAI! Server live sekarang 100% fresh dan bersih dari 0!')
      conn.end()
      process.exit(0)
    } catch (e) {
      console.error('Reset error:', e)
      conn.end()
      process.exit(1)
    }
  })

  conn.on('error', (err) => {
    console.error('SSH connection error:', err)
    process.exit(1)
  })

  conn.connect(config)
}

main()
