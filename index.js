const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

let messageIndex = 0
const activeStreams = {}

app.get('/chat/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-control', 'no-cache')  
    res.setHeader('Connection', 'keep-alive')

    const streamId = Date.now().toString()
    const controller = new AbortController()
    activeStreams[streamId] = controller

    res.write(`data: ${JSON.stringify({ type: 'connected', streamId })}\n\n`)
})

const chatRoutes = require('./routes/chat')
app.use('/chat', chatRoutes)

app.listen(3000, () => {
    console.log('Server running on port 3000')
})