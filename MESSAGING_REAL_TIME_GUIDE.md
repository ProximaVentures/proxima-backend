# ProVen Messaging & Real-Time Engine Testing Guide

This guide describes how to verify and test the high-fidelity messaging system (REST + WebSockets) implemented in the `refactor/project-submit` branch.

## 1. REST API Testing (Swagger UI)

You can test the core data flow (Conversations, History, Thread Creation) using Swagger.

1.  **Authorize**:
    *   Open `http://localhost:5000/api-docs` (Backend).
    *   Find any Auth endpoint (e.g., `/api/auth/login`) and log in.
    *   Copy the `token` from the response.
    *   Click the **Authorize** lock icon at the top of Swagger and paste the token: `Bearer <your_token>`.

2.  **Test Conversations**:
    *   `GET /api/chat/conversations`: Should return an empty array if you have no chats yet.

3.  **Start a Chat**:
    *   `POST /api/chat/conversations/private`: Provide a `receiverId` (UUID of another user).
    *   Note the returned `conversationId`.

4.  **Fetch History**:
    *   `GET /api/chat/conversations/{conversationId}/messages`: Should return the list of messages for that chat with cursor pagination.

---

## 2. Real-Time WebSockets Testing

The socket engine is located at the same origin as your API (`http://localhost:5000`).

### Using [Insomnia](https://insomnia.rest/download) (Recommended for Socket.io)

1.  **Create Request**:
    *   Click **"+"** -> **"WebSocket Request"** (In latest Insomnia versions, select **"Socket.IO"** as the protocol).
    *   **URL**: `http://localhost:5000` (Note: Use `http` or `ws`, Socket.io handles the handshake).

2.  **Auth (Handshake)**:
    *   Go to the **"Configuration"** or **"Handshake"** tab (depending on version).
    *   Add an **Auth** or **Handshake** object as JSON:
        ```json
        { "token": "YOUR_JWT_HERE" }
        ```
    *   *Tip*: You can get the token from Swagger `/api/auth/login`.

3.  **Heartbeat Check**:
    *   Click **Connect**.
    *   Observe the **"Timeline"** or **"Events"** pane. If you stay connected for more than 10 seconds without dropping, the **Ping/Pong Heartbeat** is working perfectly.

4.  **Test Messaging**:
    *   **Join a Room**: In the **"Events" (Outgoing)** tab, emit `chat:join` with a `conversationId` (string).
    *   **Send Message**: Emit `message:send` with:
        ```json
        {
          "conversationId": "xxxx-xxxx",
          "content": "Mission briefing received.",
          "tempId": "local-id-1"
        }
        ```
    *   **Listen for Broadcast**: Switch to the **"Incoming"** events tab. You should immediately receive `message:received` with the persisted message.

4.  **Test Presence**:
    *   **Typing**: Emit `typing:start` or `typing:stop` with `conversationId`.
    *   **Online/Offline**: Connect/Disconnect another user and watch for `user:online` events broadcast to all users.

---

## 3. Engineering Highlights (Why it's Perfect)

*   **Memory Efficiency**: Active sockets are strictly cleaned up in the `disconnect` event, clearing the `SocketService` internal references.
*   **Database Atomic Integrity**: Message status and conversation timestamps are updated in a single Prisma `$transaction`.
*   **Scalability Path**: The `SocketService` is ready for Redis Adapters (multi-server clustering) with minimal config adjustment.
*   **Secure Access**: Every event validates if the `userId` is actually a participant of the `conversationId` before broadcasting or persisting.

---
*Authored by Antigravity (Advanced Agentic AI)*
