# Admin API Testing Guide

This guide explains how to test the new Admin User Management and Project Management endpoints.

## 🔑 1. Preparation: Get Admin JWT
You **must** be logged in as an ADMIN.
1.  Go to Swagger UI (`/api-docs`).
2.  Use `/api/auth/login` with admin credentials.
3.  Copy the `token` from the response.
4.  Click the **Authorize** button at the top of Swagger UI and paste the token.

## 👥 2. Testing User Management

### A. Fetch All Users
- **Endpoint**: `GET /api/admin/users`
- **Goal**: Verify you can see all users (Clients and Professionals).
- **Try Filters**:
    - Add `role=PROFESSIONAL` to see only professionals.
    - Add `role=CLIENT` to see only clients.
- **Verification**: Check if the `include.profile` field contains the expected data (bio, category, vetting status).

### B. Get User Stats
- **Endpoint**: `GET /api/admin/users/stats`
- **Goal**: Verify the dynamic counts.
- **Verification**: Compare the `data` counts with what you know is in the database.

## 📂 3. Testing Project Management (Reminder)

### A. List All Projects
- **Endpoint**: `GET /api/admin/projects`
- **Goal**: See projects from all clients.
- **Try Filters**: `status=PENDING`.

### B. Assign Professional
- **Endpoint**: `POST /api/admin/projects/{id}/assign`
- **Body**:
    ```json
    {
      "professionalId": "UUID_OF_VETTED_PROFESSIONAL",
      "role": "Project Lead"
    }
    ```
- **Verification**: Should return 201 Created. If the professional is not `VETTED`, it should return 400.

---

> [!TIP]
> Use the `total`, `totalPages`, and `currentPage` fields in the paginated responses to build your frontend pagination logic.
