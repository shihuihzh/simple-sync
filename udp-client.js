const dgram = require('node:dgram')

const client = dgram.createSocket('udp4')

const pair = {}
const discoveryService = {
  address: '127.0.0.1',
  port: 20000,
}

client.on('message', (msg, rinfo) => {
  if (rinfo.address === discoveryService.address && rinfo.port === discoveryService.port) {
    console.log(`Received ${msg} from discovery service`)
    const data = JSON.parse(msg.toString())
    if (data.type === 'list') {
      data.clients.forEach((client) => {
        const key = `${client.address}:${client.port}`
        if (!pair[key]?.state) {
          pair[key] = { ...client, state: 'syncing' }
          connect(pair[key])
        }
      })
    }
  }

  if (msg.toString() === 'sync') {
    const key = `${rinfo.address}:${rinfo.port}`
    console.log(`Received sync from pair? from: ${key}`)
    pair[key].state = 'synced'
  }
})

async function connect(c) {
  while (c.state !== 'synced') {
    console.log(`Try sync to pair:${c.address}:${c.port}`)
    client.send('sync', c.port, c.address)
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }
}

client.on('error', (err) => {
  console.log(`client error:\n${err.stack}`)
  client.close()
})


client.on('listening', () => {
  const address = client.address()
  console.log(`client listening ${address.address}:${address.port}`)
})

client.bind(12345)
client.send('reg', discoveryService.port, discoveryService.address)

setInterval(() => {
  console.log('pair state: \n', JSON.stringify(pair, null, 2))
}, 10_000)
