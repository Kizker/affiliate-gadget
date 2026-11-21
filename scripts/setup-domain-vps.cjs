const { Client } = require('ssh2')

const conn = new Client()

const config = {
  host: '187.77.112.3',
  port: 22,
  username: 'root',
  password: '@Dea20031802',
  keepaliveInterval: 10000,
  keepaliveCountMax: 60,
  readyTimeout: 600000,
}

function runRemoteCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`\n>>> Executing on VPS: ${command}\n`)
    conn.exec(command, (err, stream) => {
      if (err) return reject(err)
      let output = ''
      stream
        .on('close', (code) => {
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
      // 1. Check DNS resolution for affiliategadget.id
      const resolvedIp = (await runRemoteCommand('dig +short affiliategadget.id @8.8.8.8')).trim()
      console.log(`\nCurrent DNS for affiliategadget.id: ${resolvedIp}`)

      if (!resolvedIp.includes('187.77.112.3')) {
        console.warn(`\n[PERINGATAN DNS]: affiliategadget.id saat ini masih mengarah ke ${resolvedIp}.`)
        console.warn('Wajib arahkan A Record di panel domain ke IP VPS: 187.77.112.3 terlebih dahulu agar Let\'s Encrypt SSL bisa terbit.')
      } else {
        console.log('\n[DNS VALID]: Domain affiliategadget.id sudah mengarah ke VPS (187.77.112.3).')
        
        // 2. Stop Nginx container temporarily so port 80 is free for certbot standalone
        console.log('\nStopping Nginx container for Certbot verification...')
        await runRemoteCommand('cd /opt/affiliate-gadget && docker compose stop nginx')

        // 3. Issue SSL Certificate via Certbot standalone
        console.log('\nIssuing Let\'s Encrypt SSL Certificate for affiliategadget.id and www.affiliategadget.id...')
        await runRemoteCommand('certbot certonly --standalone -d affiliategadget.id -d www.affiliategadget.id --non-interactive --agree-tos --register-unsafely-without-email || certbot certonly --standalone -d affiliategadget.id --non-interactive --agree-tos --register-unsafely-without-email')

        // 4. Update Nginx SSL configuration to point to affiliategadget.id certificates
        console.log('\nUpdating Nginx SSL configuration...')
        const updateNginxSslCmd = `sed -i 's|/etc/letsencrypt/live/affiliategadget.tech/|/etc/letsencrypt/live/affiliategadget.id/|g' /opt/affiliate-gadget/nginx/nginx.conf`
        await runRemoteCommand(updateNginxSslCmd)

        // 5. Update .env in VPS to use https://affiliategadget.id
        console.log('\nUpdating .env domain in VPS...')
        await runRemoteCommand(`sed -i 's|https://affiliategadget.tech|https://affiliategadget.id|g' /opt/affiliate-gadget/.env`)

        // 6. Start Nginx container
        console.log('\nStarting Nginx container...')
        await runRemoteCommand('cd /opt/affiliate-gadget && docker compose up -d nginx')

        // 7. Verify HTTPS response
        const httpsCode = await runRemoteCommand('curl -s -o /dev/null -w "%{http_code}" https://affiliategadget.id')
        console.log(`\nHTTPS Response Code for https://affiliategadget.id: ${httpsCode.trim()}`)
      }

      conn.end()
      process.exit(0)
    } catch (e) {
      console.error('Setup error:', e)
      conn.end()
      process.exit(1)
    }
  })

  conn.connect(config)
}

main()
