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

None of the optional bonuses were implemented. The focus was on solid core functionality, clear architecture, and clean code.

---

## Time spent

~17 hours on the core app. According to Waka time, divided over about 2 weeks from getting the assignment to finishing it.
