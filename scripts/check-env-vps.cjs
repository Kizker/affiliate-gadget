const { Client } = require('ssh2')
const conn = new Client()

conn.on('ready', () => {
  conn.exec('grep -i -E "NEXTAUTH|APP_URL|AUTH" /opt/affiliate-gadget/.env', (err, stream) => {
    if (err) throw err
    stream.on('close', () => conn.end())
    stream.on('data', d => process.stdout.write(d))
    stream.stderr.on('data', d => process.stderr.write(d))
  })
}).connect({ host: '187.77.112.3', port: 22, username: 'root', password: '@Dea20031802' })
