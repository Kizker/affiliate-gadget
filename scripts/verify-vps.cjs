const { Client } = require('ssh2')
const conn = new Client()

conn.on('ready', () => {
  console.log('Testing WebSocket handshake and Docker health on VPS...')
  conn.exec(
    'curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" -H "Sec-WebSocket-Version: 13" https://affiliategadget.tech/ws',
    (err, stream) => {
      if (err) throw err
      stream
        .on('close', () => {
          conn.exec('docker compose -f /opt/affiliate-gadget/docker-compose.yml ps', (err2, stream2) => {
            if (err2) throw err2
            stream2
              .on('close', () => conn.end())
              .on('data', (d) => process.stdout.write(d))
          })
        })
        .on('data', (d) => process.stdout.write(d))
        .stderr.on('data', (d) => process.stderr.write(d))
    }
  )
}).connect({ host: '187.77.112.3', port: 22, username: 'root', password: '@Dea20031802' })
