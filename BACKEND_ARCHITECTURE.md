# ProVen Backend Architecture Guide

This document breaks down the "ProProven" backend codebase, explaining the structure, the "why" behind each component, and how it all connects.

---

## 📂 Folder Structure & The "Why"

We follow a **Layered Architecture** (Controller-Service-Repository pattern, simplified for Express). This keeps code organized, testable, and scalable.

```
proven-backend/src/
├── controllers/       # 🧠 The Brains: Handles incoming requests (req) and sends responses (res).
├── middleware/        # 🛡️ The Guards: Runs BEFORE controllers (Security, Validation, Error Handling).
├── routes/            # 🚦 The Maps: Defines URL paths (e.g., /auth/login) and links them to controllers.
├── utils/             # 🔧 The Tools: Helper functions (Email, DB connection) reused everywhere.
├── validators/        # 📝 The Checklists: Enforces rules on input data (e.g., "Password must be 8 chars").
├── interfaces/        # 🏷️ The Labels: TypeScript definitions to ensure data looks exactly how we expect.
└── index.ts           # 🚀 The Launchpad: The entry point that starts the server.
```

---

## 🧠 Code Breakdown & Connections

### 1. The Entry Point (`index.ts`)
This is where the server starts. It:
- **Secures the app** with `helmet` (HTTP headers) and `cors` (Frontend permission).
- **Hooks up routes** (`app.use('/api/auth', authRoutes)`).
- **Catches errors** globally with `errorHandler`.

### 2. The Routes (`routes/auth.routes.ts`)
Think of this as a traffic controller.
- It receives a request: `POST /register`.
- It checks the data: `validate(registerSchema)`.
- It sends it to the controller: `authController.register`.

### 3. The Middleware (`middleware/auth.middleware.ts`)
These are the security gates.
- **`protect`**: Checks if the user is sending a valid JWT token. If not, it blocks access (401 Unauthorized).
- **`ensureOnboardingComplete`**: Checks if a Professional has finished their profile. If not, it blocks access (403 Forbidden).

### 4. The Controller (`controllers/auth.controller.ts`)
This contains the business logic.
- **`asyncHandler`**: A wrapper that automatically catches crashes so the server doesn't die.
- **`prisma.$transaction`**: Ensures that creating a User *and* a Profile happens together. If one fails, *both* are cancelled. This prevents "ghost" users without profiles.

---

## 🔐 Security Breakdown

We act like a bank vault. Here are the active security layers:

1.  **Helmet (`helmet()`)**: Sets HTTP headers to stop common browser hacks (like XSS scripts).
2.  **Input Validation (`zod`)**: We verify every single piece of data sent by the user *before* it touches our database.
    - *Why?* Prevents bad data and SQL injection-like attacks.
3.  **Password Hashing (`bcrypt`)**: We verify passwords but *never* save them. We save a mathematical "hash".
    - *Why?* If hackers steal the DB, they only get useless hashes, not real passwords.
4.  **JWT Tokens (`jsonwebtoken`)**: We give users a digital ID card (Token) instead of keeping a session open.
    - *Why?* It's stateless and scales infinitely.
5.  **Role-Based Access Control (RBAC)**: We check `req.user.role` before allowing sensitive actions.

### 🛡️ Future Security Improvements
- **Rate Limiting**: Add `express-rate-limit` to stop hackers from spamming log-in attempts.
- **CSRF Protection**: Critical if we switch to cookie-based auth.
- **Audit Logging**: Record *who* did *what* and *when* for every Admin action.

---

## 🎓 Understanding "Class" Syntax

You might see `class` used in TypeScript. In our codebase, we mostly use **Functional Programming** (const functions), but we use Classes for specific object types, primarily Errors.

**Example: `AppError extends Error`**

```typescript
// Define a Blueprint (Class)
export class AppError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message); // Call the parent "Error" constructor
        this.statusCode = statusCode; // Add our custom property
    }
}
```

- **The "Why"**: Javascript has a built-in `Error` object. We want all its features (stack trace) *plus* a `statusCode` (404, 400, etc.).
- **`extends`**: Means "Take everything from `Error` and add to it."
- **`constructor`**: The function that runs when you say `new AppError(...)`.
- **`this`**: Refers to the specific instance of the error currently being created.

We generally prefer **Functions** for logic (Controllers) and **Classes** for data structures or extended behaviors (Errors, Models).
