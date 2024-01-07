const dgram = require('node:dgram')
const server = dgram.createSocket('udp4')

const clients = []

server.on('error', (err) => {
    console.error(`server error:\n${err.stack}`)
    server.close()
})

server.on('message', (msg, rinfo) => {
    console.log(`server got ${msg} from ${rinfo.address}:${rinfo.port}`)
    if (msg.toString() === 'reg') {
        // send back address
        server.send(JSON.stringify({ type: 'reg', address: rinfo.address, port: rinfo.port }), rinfo.port, rinfo.address)
        // add client to list
        clients.push({ address: rinfo.address, port: rinfo.port })
    }
})

setInterval(() => {
    clients.forEach((client) => {
        console.log('Send list to:', client);
        server.send(
            JSON.stringify({ type: 'list', clients: clients.filter((c) => !(c.address === client.address && c.port === client.port)) }),
            client.port,
            client.address
        )
    })
}, 10_000)

server.on('listening', () => {
    const address = server.address()
    console.log(`discovery server listening ${address.address}:${address.port}`)
})

server.bind(20000)
