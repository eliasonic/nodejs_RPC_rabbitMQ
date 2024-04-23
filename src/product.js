const express = require('express')
const { RPCObserver, RPCRequest } = require('./rpc')
const PORT = 9000

const app = express()
app.use(express.json())

const fakeProductResponse = {
    _id: '58630jd643zel86',
    title: 'iPhone',
    price: 600
}

RPCObserver('PRODUCT_RPC_QUEUE', fakeProductResponse)

app.get('/customer', async (req, res) => {
    const requestPayload = {
        customerId: '264g5jdgd7463hf'
    }
    try {
        const responseData = await RPCRequest('CUSTOMER_RPC_QUEUE', requestPayload)
        return res.status(200).json(responseData)
    } catch (err) {
        return res.status(500).json(err)
    }
})

app.get('/', (req, res) => {
   return res.json('Product Service')
})

app.listen(PORT, () => {
    console.log(`Product service is running on ${PORT}`)
    console.clear()
})