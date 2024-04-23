const amqplib = require('amqplib')
const { v4: uuid4 } = require('uuid')

let amqplibConnection = null

const getChannel = async () => {
    if (amqplibConnection === null) {
        amqplibConnection = await amqplib.connect('amqp://localhost')
    }
    return await amqplibConnection.createChannel()
}

const DB = (payload, fakeResponse) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (payload) {
                resolve(fakeResponse)
            } else {
                reject('No data found')
            }
        }, 3000)
    })
}

const RPCObserver = async (RPC_QUEUE_NAME, fakeResponse) => {
    const channel = await getChannel()

    await channel.assertQueue(RPC_QUEUE_NAME, {
        durable: false
    })

    channel.prefetch(1)

    channel.consume(RPC_QUEUE_NAME, async (msg) => {
        if (msg.content) {
            // Database operation
            const payload = JSON.parse(msg.content.toString())
            const response = await DB(payload, fakeResponse)

            channel.sendToQueue(
                msg.properties.replyTo, 
                Buffer.from(JSON.stringify(response)), 
                {
                    correlationId: msg.properties.correlationId
                }
            )

            channel.ack(msg)
        }
    }, {
        noAck: false
    })
}

const RPCRequest = async (RPC_QUEUE_NAME, requestPayload) => {
    const channel = await getChannel()

    const q = await channel.assertQueue('', {
        exclusive: true
    })

    const uuid = uuid4()

    channel.sendToQueue(RPC_QUEUE_NAME, Buffer.from(JSON.stringify(requestPayload)), {
        replyTo: q.queue,
        correlationId: uuid
    })   

    return new Promise((resolve, reject) => {
        const timeOut = setTimeout(() => {
            channel.close()
            resolve('API could not fulfill the request!')
        }, 8000)
    
        channel.consume(
            q.queue, 
            (msg) => {
                if (msg.properties.correlationId === uuid) {
                    resolve(JSON.parse(msg.content.toString()))
                    clearTimeout(timeOut)
                } else {
                    reject('No data found')
                }
            }, 
            {
            noAck: true 
            }
        )
    })
}

module.exports = {
    getChannel,
    RPCObserver,
    RPCRequest
}