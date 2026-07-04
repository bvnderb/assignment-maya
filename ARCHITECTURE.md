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
- **Stream failure / dropped connection** — the frontend attaches an `onerror` handler to every `EventSource` (covering both the initial stream and resume). When it fires, the connection is closed immediately and the message is marked `failed`, showing a Retry button on that specific message. This intentionally overrides `EventSource`'s native auto-reconnect behavior — left alone, the browser would keep silently retrying the connection in the background and could resume delivering tokens into a message the UI had already given up on, producing duplicate or ghost content
- **Retry after failure** — clicking Retry on a failed message restarts the stream from scratch (`/chat/stream`) into that same message slot: previous partial content and the `failed` flag are cleared first, so the retry reuses the existing bubble instead of appending a new one

### Knowingly left out

- **`/stop` has no guard if `streamId` is missing from `activeStreams`** — not fixed because the UI prevents this: the Stop button is only visible while streaming is active, so a valid `streamId` always exists
- **`connected` event fires on resume as well as on initial stream** — not fixed because `handleResume` registers no `message` event listener, so the event is silently ignored and causes no side effects
- **Stale UI state after a server restart on Railway** — `activeStreams` and `pausedStreams` live only in server memory. If the Railway container restarts or redeploys (e.g. a crash, a new deploy, or the free-tier service waking from idle) while a message is mid-stream or paused, that in-memory state is wiped. A client still holding an old `streamId` can be left showing a stale state (e.g. a message stuck as "Stopped") until the user sends a new message or refreshes. This is a consequence of choosing not to run a database for stream state — fixing it properly would mean moving `activeStreams`/`pausedStreams` into a database or something like Redis, which is out of scope for this assignment. Note that this is distinct from *conversation* persistence, which is covered separately below. Noted here as a known limitation rather than fixed.

---

## Bonus: Conversation persistence (localStorage)

Conversations are persisted to the browser's `localStorage`, so a page refresh doesn't lose the chat.

**Why localStorage over a database:** the assignment listed a database as optional, and this is a single-user demo with no auth or multi-device requirement. `localStorage` gives real persistence with zero backend or infrastructure cost. The tradeoff is that it's scoped to one browser on one device — a real product would need a database keyed by user/session instead.

**Save:** a `useEffect` in `ChatWindow.jsx`, dependent on `[messages]`, writes the entire `messages` array to `localStorage` as a JSON string (`JSON.stringify`) every time it changes — a new message, a streamed token, a stop, or a retry all trigger a save.

**Load — the lazy initializer pattern:** `messages` is initialized with `useState(loadState)`, passing the `loadState` function itself (not calling it — no parentheses) as the initial-value argument. React calls it exactly once, synchronously, during the component's very first render — before any `useEffect` runs. This matters because of a real race condition encountered while building it: if loading had instead happened inside a `useEffect` (which only runs *after* the first render), the *save* effect's first run would fire on that same initial render too, immediately overwriting any saved conversation with `messages`' still-empty starting value, before the load effect ever got a chance to populate it. The lazy initializer closes that gap entirely, since `messages` already holds the loaded data before any effect runs at all.

**The `JSON.parse(null)` gotcha:** `localStorage.getItem` returns `null` (not `undefined`, not an empty string) when a key was never set. `JSON.parse(null)` does not throw — `null` gets coerced to the string `"null"`, which is valid JSON, so it returns the JS value `null`. Left unguarded, that would set `messages` to `null` on a first-ever visit, and the app would crash on render (`null.length` and `[...null]` both throw). `loadState` guards against this with a simple ternary: `saved ? JSON.parse(saved) : []`.

---

## Bonus: Resume after reconnect

If the SSE connection drops unexpectedly — a network blip, wifi dropping, a tab losing connectivity mid-stream — the app now detects it and resumes automatically, without the user clicking anything.

**Server-side detection:** `res` (the Express response object) emits a `close` event whenever the underlying connection is torn down, whether that's a normal finish or a client disconnecting mid-stream. `streamMessage` hooks that event straight into the same cancellation mechanism already used by `/stop`:
```js
const controller = new AbortController()
res.on("close", () => controller.abort())
```
Because the streaming loop already checks `controller.signal.aborted` and saves `{ wordIndex, messageIndex }` to `pausedStreams` before breaking, a real disconnect is handled by the exact same code path as a manual Stop — no separate detection logic needed. Calling `.abort()` after the loop has already finished normally is a harmless no-op, since nothing checks the signal again after that point.

**Client-side auto-retry:** `handleError` checks a `retryCount` ref against a `maxRetries` cap (3) before falling back to the existing failed/Retry-button state. If attempts remain, it increments the counter, closes the stale `EventSource`, and calls `handleResume()` automatically. The counter resets to `0` on two "connection is healthy again" signals: a stream reaching its `done` event, or the user manually clicking Retry. Without a cap, a persistently unreachable server would cause an infinite retry loop — each failed resume attempt opening a new `EventSource` that immediately errors again, forever.

**Testing note:** verifying this locally has a couple of non-obvious gotchas. Chrome DevTools' "Offline" network throttle does not reliably interrupt an already-open connection to `localhost` — the stream kept flowing as if nothing happened. Killing and restarting the local server to simulate a drop doesn't work either, since `pausedStreams` only ever lives in that process's memory and gets wiped on restart. The reliable local test was to reload the browser tab mid-stream (a real disconnect from the server's perspective, while the server process itself stays untouched) and manually hit `/chat/resume/:streamId` to confirm the server resumed from the correct word instead of 404ing.

---

## Bonus: Regenerate last reply

A Regenerate button appears under the assistant's most recent reply once it has finished streaming successfully, letting the user request a new response in its place.

**Deciding when to show it:** `MessageList.jsx` computes a `showRegenerate` boolean while mapping over `messages`:
```js
const showRegenerate = index === messages.length - 1 && message.role === "assistant" && streamStatus === "idle";
```
All three conditions matter: it must be the *last* message in the conversation (not an older reply), it must be the *assistant's* message (not the user's), and `streamStatus` must be `"idle"` (the stream has actually finished — not mid-stream, not stopped, not failed, since those states are handled by the existing Stopped label and Retry button instead).

**Reusing `handleRetry` instead of writing a new function:** Regenerating a reply needs to do exactly what retrying a failed one does — clear the bubble's content, close any stale `EventSource`, open a fresh `/chat/stream`, and reset `retryCount` back to `0` so the new stream gets a full auto-resume budget if it happens to drop. Since none of those steps are specific to the failure case, the Regenerate button's `onClick` reuses `handleRetry` directly rather than duplicating a near-identical function.

---

## Bonus: Tests proving cancellation

A Jest unit test (`server/routes/chat.test.js`) proves that stopping a stream genuinely halts token generation server-side, rather than just hiding it on the frontend.

**Scoped-down unit test over a full HTTP integration test:** the alternative would have been a real end-to-end test via `supertest`, hitting `/chat/stream` and `/chat/stop` over an actual HTTP connection and capturing real streamed chunks. That approach is more realistic but adds meaningfully more complexity — a real server, real timing, real concurrency — for a project already well past its original time estimate. Instead, `chat.js` now exports `streamMessage` directly (previously only `router` was exported, via `module.exports = { router, streamMessage }`), and the test calls it with a mocked `res` object — no real HTTP connection involved.

**Two mocks, two different jobs:** the fake `res` has `write`, `on`, `setHeader`, and `end` as `jest.fn()`s, but only two of them matter for this test, and they play opposite roles:
- `res.on` is the *trigger*. `streamMessage` calls `res.on("close", () => controller.abort())` to register its own cancellation hook. Since `res.on` is a `jest.fn()`, that call is captured rather than acted on for real — the test reaches into `res.on.mock.calls[0][1]` to pull out that exact callback function, then calls it directly, on command, standing in for a real disconnect or a real `/chat/stop` request.
- `res.write` is the *observer*. Every token write increments its call log; the test never drives anything through it, only reads from it afterward as evidence.

**Why the assertion filters for `"token"` specifically, not total write count:** after the loop breaks from an abort, `streamMessage` always writes one more event — `paused` or `done` (see lines 32-37 of `chat.js`) — before closing the response. A naive assertion checking that the *total* number of `res.write` calls stayed flat after the abort would be wrong, since one more legitimate write is expected. The test instead filters `res.write.mock.calls` down to only the ones containing `"token"`, snapshots that count at the moment cancellation is triggered, and asserts it's unchanged once `streamMessage` fully finishes — proving no *additional* tokens were generated after the stop, while still allowing the expected final `paused` write.

**Knowingly left out — reconciliation after failure:** the assignment's second Tests requirement ("the app reconciles correctly after a failure") was scoped out of automated testing. Unlike cancellation, which is fully containable inside one server-side function, reconciliation spans both server state (`pausedStreams`) and client-side retry logic (`retryCount`, `handleError` in `ChatWindow.jsx`) — testing it properly would mean either a real HTTP integration test (`supertest`) or introducing a separate frontend testing tool, comparable in scope to the "proper" version of the cancellation test that was already scoped down in favor of the approach above. Given the time already invested in this project, this was verified manually instead (see "Resume after reconnect" above for the manual test procedure used) rather than automated.
