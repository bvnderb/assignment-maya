require("dotenv").config()
const express = require("express")
const cors = require("cors")
const { router } = require("./routes/chat")

const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN_URL }))
app.use(express.json())
app.use("/chat", router)

app.listen(3000, () => {
    console.log("Server running on port 3000")
})