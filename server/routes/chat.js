const ASSISTANT_MESSAGES = require('../data/messages')
const express = require('express')

const router = express.Router()
const activeStreams = {}
const pausedStreams = {}
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
let messageIndex = 0

const streamMessage = async (res, streamId, messageIndex, startFrom) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-control', 'no-cache')  
    res.setHeader('Connection', 'keep-alive')

    res.write(`data: ${JSON.stringify({ type: 'connected', streamId })}\n\n`)

    const controller = new AbortController()
    activeStreams[streamId] = controller

    const words = ASSISTANT_MESSAGES[messageIndex].split(' ')

    for (let i = startFrom; i < words.length; i++) {
        if (controller.signal.aborted) {
            pausedStreams[streamId] = i
            break
        } 
            res.write(`data: ${JSON.stringify({ type: 'token', word: words[i] })}\n\n`)
            await delay(Math.random() * 40 + 40)
    }

    if (pausedStreams[streamId] !== undefined) {
            res.write(`data: ${JSON.stringify({ type: 'paused' })}\n\n`)
        } else {
            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        }
    res.end()
}

router.get('/stream',async (req, res) => {
    const streamId = Date.now().toString()
    await streamMessage(res, streamId, messageIndex, 0)
    messageIndex = (messageIndex + 1) % ASSISTANT_MESSAGES.length
})

router.post('/stop', (req, res) => {
    const streamId = req.body.streamId
    activeStreams[streamId].abort()
    res.json({ success: true })
})

router.post('/resume', async (req, res) => {
    const streamId = req.body.streamId
    const wordIndex = pausedStreams[streamId]
    delete pausedStreams[streamId]
    await streamMessage(res, streamId, messageIndex, wordIndex)
    messageIndex = (messageIndex + 1) % ASSISTANT_MESSAGES.length
})


module.exports = router