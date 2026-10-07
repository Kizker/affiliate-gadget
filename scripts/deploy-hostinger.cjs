const { Client } = require('ssh2')

const conn = new Client()

const config = {
  host: '187.77.112.3',
  port: 22,
  username: 'root',
  password: '@Dea20031802',
  keepaliveInterval: 10000,
  keepaliveCountMax: 20,
  readyTimeout: 60000,
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

      // 1.5. Synchronize Prisma Database Schema (auto db push)
      await runRemoteCommand(`docker run --rm \\
        --network affiliate_gadget_network \\
        -v /opt/affiliate-gadget:/app \\
        -w /app \\
        -e DATABASE_URL="postgresql://agadget:AgProd2026Secure@postgres:5432/affiliate_gadget?schema=public" \\
        node:22-alpine \\
        sh -c "apk add --no-cache openssl && npx prisma@6.19.1 db push --schema=./prisma/schema.prisma --accept-data-loss"`)

      // 2. Build app container (and ws-server if needed)
      await runRemoteCommand('cd /opt/affiliate-gadget && docker compose build app')
      await runRemoteCommand('cd /opt/affiliate-gadget && docker compose up -d app ws-server')

      // 3. Restart nginx to refresh upstream IPs
      await runRemoteCommand('cd /opt/affiliate-gadget && docker compose restart nginx')

      // 4. Inspect container status
      await runRemoteCommand('cd /opt/affiliate-gadget && docker compose ps')

      // 5. Test HTTP response
      const httpCode = await runRemoteCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000')
      console.log(`\nLocal HTTP Response Code: ${httpCode.trim()}`)

      console.log('\nDeployment completed successfully!')
      conn.end()
      process.exit(0)
    } catch (e) {
      console.error('Deployment error:', e)
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
