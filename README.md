# Maya Travel — Streaming Chat Assignment

A streaming chat application where a user sends a message and the assistant replies word by word, like ChatGPT. Built with React on the frontend and Node.js + Express on the backend, using Server-Sent Events (SSE) for streaming.

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
- [ ] Regenerate last reply
- [ ] Tests proving server-side cancellation
- [ ] Docker + docker-compose

(In progress — being completed incrementally.)

---

## Time spent

~22 hours on the core app. According to Waka time, divided over about 2 weeks from getting the assignment to finishing it.