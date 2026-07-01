# Architecture

## High-level overview

The application is split into three layers: frontend, streaming, and backend.

The **frontend** (React) handles user input and UI state. When a user sends a message, the frontend adds it to the chat optimistically and checks its internal `streamStatus` to decide which HTTP request to make — a new stream, a stop, or a resume.

The **streaming layer** is a Server-Sent Events (SSE) connection. This is the pipe between frontend and backend. It is one-directional: the backend pushes tokens through it to the frontend one word at a time. Regular HTTP requests (`fetch`, `EventSource`) flow from the frontend to the backend; tokens flow back through SSE.

The **backend** (Node.js + Express) manages stream state and message delivery. It generates the `streamId`, tracks active and paused streams, and controls which word of which message to send and when.

> Note: user message content is not sent to the backend — replies are pre-written canned responses. In a production system the message would be passed to an LLM and the response streamed back.

---

## Why Express

Express was chosen for its simplicity and ecosystem maturity. It is the most widely adopted Node framework, with extensive documentation and tutorials — which made it the natural starting point. Its lightweight, minimal-boilerplate approach was a good fit for a straightforward API with only a few routes.

---

## SSE vs WebSocket

SSE was chosen over WebSocket for one reason: this application only needs **one-directional streaming** — server to client.

WebSocket keeps a persistent bidirectional connection open, meaning both the client and server can send messages at any time. That is the right tool when both sides need to push data — a multiplayer game, a collaborative editor, a live chat between two users.

In this app, the client never needs to push data through the streaming connection. User input (send, stop, resume) is sent as normal HTTP requests. The server only needs to push tokens back. SSE does exactly that, with less complexity, over plain HTTP, with no additional libraries required.

---

## Message flow: send → stream → render

1. User types a message and hits Send
2. Frontend adds the user message and an empty assistant bubble to the UI immediately (optimistic UI)
3. Frontend opens an `EventSource` connection to `GET /chat/stream`
4. Backend receives the connection, generates a `streamId`, and sends it back as a `connected` event
5. Frontend stores the `streamId` for use in stop/resume
6. Backend starts looping through the words of the current message, emitting each one as a `token` event with a small delay
7. Frontend listens for `token` events and appends each word to the assistant bubble in real time
8. When the loop finishes, the backend emits a `done` event and closes the connection
9. Frontend closes the `EventSource` and sets status back to idle

---

## How Stop cancels work on the server

Stopping is a true server-side cancellation — not just hiding the stream on the frontend.

When the user clicks Stop:
1. Frontend closes the `EventSource` to stop receiving tokens
2. Frontend POSTs to `/chat/stop` with the `streamId`
3. Backend looks up the `AbortController` stored in `activeStreams[streamId]` and calls `.abort()`
4. On the next iteration of the streaming loop, `controller.signal.aborted` is `true` — the loop breaks immediately
5. The current word index and message index are saved to `pausedStreams[streamId]`
6. A `paused` event is sent to the frontend and the connection closes

The server stops producing tokens as soon as `.abort()` is called. It does not finish the message in the background.

When the user clicks Resume:
1. Frontend opens a new `EventSource` to `GET /chat/resume/:streamId`
2. Backend reads the saved word index and message index from `pausedStreams`
3. Streaming resumes from the exact word where it stopped — no duplicates, no skipped words

---

## Failure cases

### Handled

- **Mid-stream cancellation** — Stop button cancels server-side via `AbortController`; partial reply is preserved and marked as stopped
- **Resume after stop** — resumes from the correct word and correct message using saved state in `pausedStreams`
- **Wrong message on resume** — fixed by saving `messageIndex` alongside `wordIndex` in `pausedStreams`; the global `messageIndex` is only incremented by `/stream` after a full or partial stream completes

### Knowingly left out

- **`/stop` has no guard if `streamId` is missing from `activeStreams`** — not fixed because the UI prevents this: the Stop button is only visible while streaming is active, so a valid `streamId` always exists
- **`connected` event fires on resume as well as on initial stream** — not fixed because `handleResume` registers no `message` event listener, so the event is silently ignored and causes no side effects
- **Auto-recovery on connection drop** — if the SSE connection drops unexpectedly (network issue), the stream is not automatically resumed. The user would need to refresh. This was out of scope for this assignment.
- **No persistence** — conversation history is held in React state only. Refreshing the page clears everything.
