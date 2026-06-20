const ASSISTANT_MESSAGES = require('../data/messages')
const express = require('express')

const router = express.Router()
const activeStreams = {}
let messageIndex = 0
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

router.get('/stream',async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-control', 'no-cache')  
    res.setHeader('Connection', 'keep-alive')

    const streamId = Date.now().toString()
    const controller = new AbortController()
    activeStreams[streamId] = controller

    res.write(`data: ${JSON.stringify({ type: 'connected', streamId })}\n\n`)

    const words = ASSISTANT_MESSAGES[messageIndex].split(' ')

    for (const word of words) {
        if (controller.signal.aborted) break
        res.write(`data: ${JSON.stringify({ type: 'token', word })}\n\n`)
        await delay(Math.random() * 40 + 40)
    }

    messageIndex = (messageIndex + 1) % ASSISTANT_MESSAGES.length
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
    res.end()
})

module.exports = router