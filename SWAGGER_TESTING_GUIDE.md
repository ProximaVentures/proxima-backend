# ProVen Backend Testing Guide (Swagger UI)

This guide walks you through testing the entire "Fraud-Proof" Onboarding flow using Swagger UI.

## ⚡ Prerequisites

1.  **Ensure DB is running**: Make sure your Postgres database is active.
2.  **Start the Server**:
    ```bash
    cd proven-backend
    npx prisma generate
    npx prisma db push
    npm run dev
    ```
3.  **Open Swagger**: Navigate to `http://localhost:5000/api-docs` in your browser.

---

## 🧪 Testing Flow

### Step 1: Register a New Professional
We need to create a new user who is a `PROFESSIONAL`.

1.  Locate `POST /api/auth/register`.
2.  Click **Try it out**.
3.  Enter this payload:
    ```json
    {
      "username": "dev_test",
      "email": "dev@test.com",
      "password": "password123",
      "role": "PROFESSIONAL"
    }
    ```
4.  Click **Execute**.
5.  **Expected Result**: `201 Created`. The response will contain a message that an OTP has been sent.
    *   *Tip*: Check your VS Code terminal (or email service) to see the simulated OTP log.

### Step 2: Verify Email (OTP)
1.  Locate `POST /api/auth/verify-otp`.
2.  Click **Try it out**.
3.  Enter the payload:
    ```json
    {
      "email": "dev@test.com",
      "code": "<ENTER_OTP_FROM_TERMINAL>"
    }
    ```
4.  Click **Execute**.
5.  **Expected Result**: `200 OK`. "Email verified successfully".

### Step 3: Login & Get Token
1.  Locate `POST /api/auth/login`.
2.  Click **Try it out**.
3.  Enter the payload:
    ```json
    {
      "email": "dev@test.com",
      "password": "password123"
    }
    ```
4.  Click **Execute**.
5.  **Expected Result**: `200 OK`. Copy the `token` string from the response body.

### Step 4: Authorize Swagger
1.  Scroll to the top of the Swagger page.
2.  Click the **Authorize** button (Lock icon).
3.  In the "Value" box, type: `Bearer <YOUR_COPIED_TOKEN>`.
4.  Click **Authorize**, then **Close**.

### Step 5: Test "Strict" Onboarding (The Fraud Check)
Now, let's try to submit a profile.

#### A. Fail Case (Missing Proof)
1.  Locate `POST /api/auth/complete-profile`.
2.  Click **Try it out**.
3.  Enter a lazy payload (missing required fields):
    ```json
    {
      "userId": "<ID_FROM_LOGIN>",
      "firstName": "Lazy",
      "lastName": "Dev",
      "category": "SOFTWARE_DEVELOPER",
      "metadata": {
        "developerType": "FRONTEND"
        // Missing github, resume, projects...
      }
    }
    ```
4.  Click **Execute**.
5.  **Expected Result**: `400 Bad Request`. The system should yell at you about missing keys.

#### B. Success Case (Full Proof)
1.  Update the payload with valid dummy data:
    ```json
    {
      "userId": "<ID_FROM_LOGIN>",
      "firstName": "Pro",
      "lastName": "Coder",
      "category": "SOFTWARE_DEVELOPER",
      "metadata": {
        "developerType": "FULLSTACK",
        "githubUrl": "https://github.com/procoder",
        "portfolioUrl": "https://procoder.dev",
        "resumeUrl": "https://procoder.dev/resume.pdf",
        "yearsOfExperience": 5,
        "mainStack": ["React", "Node", "Postgres"],
        "topProjects": [
          {
            "name": "Alpha App",
            "description": "A high-scale trading platform handling 1M users.",
            "role": "Lead Architect",
            "link": "https://alpha.app"
          },
          {
             "name": "Beta Tool",
             "description": "Internal CLI tool for automating deployment.",
             "role": "Developer",
             "link": "https://github.com/procoder/beta"
          }
        ]
      }
    }
    ```
2.  Click **Execute**.
3.  **Expected Result**: `200 OK`. Profile submitted successfully.

---

### Step 6: Verify Access
1.  Locate `GET /api/profile/dashboard`.
2.  Click **Try it out** -> **Execute**.
3.  **Expected Result**: `200 OK`. "Welcome to the Professional Dashboard!".
    *   *Note*: If you skipped Step 5, this would return `403 Forbidden`.
