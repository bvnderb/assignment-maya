const { streamMessage } = require("./chat")
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

test("stops writing tokens after abort is called", async () => {

const fakeRes = {
  write: jest.fn(),
  on: jest.fn(),
  setHeader: jest.fn(),
  end: jest.fn()
}
const streamMessagePromise = streamMessage(fakeRes, "test-1", 0, 0)

await wait(100)

const abortCallBack = fakeRes.on.mock.calls[0][1]
abortCallBack()

const tokenLengthAtAbort = fakeRes.write.mock.calls.filter((call) => call[0].includes("token")).length

await streamMessagePromise

expect(fakeRes.write.mock.calls.filter((call) => call[0].includes("token")).length).toBe(tokenLengthAtAbort)

})

