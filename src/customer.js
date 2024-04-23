const express = require('express')
const { RPCObserver, RPCRequest } = require('./rpc')
const PORT = 8000

const app = express()
app.use(express.json())

const fakeCustomerResponse = {
    _id: '264g5jdgd7463hf',
    name: 'Mike',
    country: 'Poland'
}

RPCObserver('CUSTOMER_RPC_QUEUE', fakeCustomerResponse)

app.get('/wishlist', async (req, res) => {
    const requestPayload = {
        productId: '58630jd643zel86'
    }
    try {
        const responseData = await RPCRequest('PRODUCT_RPC_QUEUE', requestPayload)
        return res.status(200).json(responseData)
    } catch (err) {
        return res.status(500).json(err)
    }
})

app.get('/', (req, res) => {
    return res.json('Customer Service')
})

app.listen(PORT, () => {
    console.log(`Customer service is running on ${PORT}`)
    console.clear()
})