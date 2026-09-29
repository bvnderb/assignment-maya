# Maya Travel — Streaming Chat Assignment
Built as part of an application for the Full-Stack Developer position at Maya Travel.

A streaming chat application where a user sends a message and the assistant replies word by word, like ChatGPT. Built with React on the frontend and Node.js + Express on the backend, using Server-Sent Events (SSE) for streaming.

**Live deployed app:** https://maya-streaming-ai-chat.up.railway.app/ => no longer online. 

---

## How to run locally

### Prerequisites
- Node.js (v18 or higher)

### 1. Clone the repository

```bash
git clone https://github.com/bvnderb/assignment-maya.git
cd assignment-maya
```

### 2. Start the server

```bash
cd server
npm install
node index.js
```

The server runs on **http://localhost:3000**

### 3. Start the client

In a new terminal:

```bash
cd client
npm install
npm run dev
```

The client runs on **http://localhost:5173**

### Alternative: Docker

If you have Docker installed, both services can be built and started together with one command from the project root:

```bash
docker compose up --build
```

Same addresses as above: server on **http://localhost:3000**, client on **http://localhost:5173**.

---

## Features

- **Streaming responses** — assistant replies stream in word by word via SSE
- **Optimistic UI** — user message and assistant placeholder appear instantly before the server responds
- **Stop button** — cancels the stream server-side using `AbortController`; partial reply stays visible and is marked as stopped
- **Resume button** — resumes from the exact word where the stream was stopped, no duplicates
- **Responsive layout** — works across desktop, tablet, and mobile

---

## Bonuses covered

- [x] **Conversation persistence (localStorage)** — chat history is saved to `localStorage` on every change and restored automatically on page load/refresh. See ARCHITECTURE.md for implementation details.
- [x] **Resume after reconnect** — a dropped connection is detected server-side and the stream resumes automatically, retrying up to 3 times before falling back to a manual Retry button. See ARCHITECTURE.md for implementation details.
- [x] **Regenerate last reply** — a Regenerate button appears under the assistant's most recent reply once it finishes streaming, letting the user get a new response in its place. See ARCHITECTURE.md for implementation details.
- [x] **Tests proving server-side cancellation** — a Jest unit test calls `streamMessage` directly with a mocked `res` object, triggers cancellation on command, and asserts no further tokens are written afterward. Reconciliation after a failure was verified manually rather than automated, given time already invested — see ARCHITECTURE.md for details and reasoning.
- [x] **Docker + docker-compose** — both services run in containers, started together with a single `docker compose up --build` command. See ARCHITECTURE.md for implementation details.

All bonuses complete.

---

## Time spent

~22 hours on the core app. 
~8 extra hours were spent on the bonus tasks. 
Bringing the total time to 30 hours of development, roughly 2 weeks from the day I received the assignment to completion. 
