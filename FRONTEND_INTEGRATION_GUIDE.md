 ProVen Frontend Integration Guide

This document guides the Frontend Team on how to integrate with the ProProven Backend, specifically focusing on the Authentication and Onboarding flow.

---

## 🔗 Base URL
- **Production**: `https://proven-backend.onrender.com/api`
- **Development**: `http://localhost:5000/api`

---

## 🔐 Authentication Flow

### 1. Register (Stage 1)
- **Endpoint**: `POST /auth/register`
- **Body**:
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "role": "PROFESSIONAL" // or "CLIENT"
  }
  ```
- **Response**: `201 Created`. Check email for OTP.

- **Response**: `200 OK`. 
  ```json
  { "success": true, "message": "Email verified successfully! You can now log in." }
  ```

### 3. Resend OTP
- **Endpoint**: `POST /auth/resend-otp`
- **Body**: `{ "email": "john@example.com" }`
- **Response**: `200 OK`. A new code is sent via Resend API.

### 3. Login
- **Endpoint**: `POST /auth/login`
- **Response**:
  ```json
  {
    "token": "eyJhbG...",
    "data": { "user": { "id": "...", "onboardingComplete": false } }
  }
  ```
- **Front-End Action**: Store `token` in `localStorage` or `cookies`. 

---

## 🌐 Social Authentication (NEW)

To provide a premium experience, we support **Google** and **Facebook** login via **Auth.js (NextAuth)**.

### 1. Frontend Flow (NextAuth)
1.  Use `signIn('google')` or `signIn('facebook')` from `next-auth/react`.
2.  Once authenticated, call the backend to link the account or sign in.

### 2. Backend Verification
- **Endpoint**: `POST /auth/social-login`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "name": "John Doe",
    "provider": "google", // or "facebook"
    "providerId": "123456789", // The unique ID from the social provider
    "image": "https://..." // Optional profile picture
  }
  ```
- **Backend Action**:
  - If user doesn't exist: Create account (skip OTP, set `isVerified: true`).
  - If user exists but is not linked: Link social ID.
- **Response**: Standard `{ "token": "...", "data": { "user": { ... } } }`.

---

## 🚧 Professional Onboarding (Stage 2)

This is a critical anti-fraud step. You must render different forms based on the user's selected Category.

### Endpoint
`POST /auth/complete-profile`

### Headers
`Authorization: Bearer <TOKEN>`

### Data Structure (Discriminated Union)

The `metadata` field allows different shapes based on the category.

#### 1. Software Developer
```json
{
  "category": "SOFTWARE_DEVELOPER",
  "firstName": "Jane",
  "lastName": "Code",
  "metadata": {
    "githubUrl": "https://github.com/...",
    "portfolioUrl": "https://...",
    "resumeUrl": "https://...",
    "yearsOfExperience": 5,
    "mainStack": ["React", "Node.js", "PostgreSQL"],
    "topProjects": [
      {
        "name": "E-commerce Platform",
        "role": "Lead Dev",
        "description": "Built a scalable platform handling 10k users...",
        "link": "https://..."
      },
      { "name": "Project 2", ... }
    ]
  }
}
```

#### 2. Project Manager
```json
{
  "category": "PROJECT_MANAGER",
  "metadata": {
    "linkedinUrl": "https://linkedin.com/...",
    "resumeUrl": "https://...",
    "certifications": ["PMP", "Scrum Master"],
    "caseStudies": "https://..."
  }
}
```

#### 3. Product Designer
```json
{
  "category": "PRODUCT_DESIGNER",
  "metadata": {
    "portfolioUrl": "https://...",
    "behanceUrl": "https://...",
    "dribbbleUrl": "https://...",
    "tools": ["Figma", "Sketch", "Adobe XD"],
    "topProjects": [...] // Array of 2 Project Objects
  }
}
```

#### 4. Graphic Designer
```json
{
  "category": "GRAPHIC_DESIGNER",
  "metadata": {
    "portfolioUrl": "https://...",
    "instagramUrl": "https://...",
    "tools": ["Photoshop", "Illustrator"]
  }
}
```

#### 5. Content Creator
```json
{
  "category": "CONTENT_CREATOR",
  "metadata": {
    "portfolioUrl": "https://...",
    "socialMediaStats": { "instagram": "10k", "tiktok": "50k" },
    "niche": "Tech Reviews"
  }
}
```

#### 6. Digital Marketer
```json
{
  "category": "DIGITAL_MARKETER",
  "metadata": {
    "portfolioUrl": "https://...",
    "certifications": ["Google Ads", "HubSpot"],
    "campaignBudgetsManaged": "$10k/month"
  }
}
```

#### 7. Accountant
```json
{
  "category": "ACCOUNTANT",
  "metadata": {
    "linkedinUrl": "https://...",
    "resumeUrl": "https://...",
    "certifications": ["CPA", "ACCA"],
    "yearsOfExperience": 7
  }
}
```

#### 8. Video Editor
```json
{
  "category": "VIDEO_EDITOR",
  "metadata": {
    "portfolioUrl": "https://...",
    "softwareProficiency": ["Premiere Pro", "DaVinci Resolve"]
  }
}
```

#### 9. Social Media Manager
```json
{
  "category": "SOCIAL_MEDIA_MANAGER",
  "metadata": {
    "portfolioUrl": "https://...",
    "platformsManaged": ["Instagram", "LinkedIn", "Twitter"]
  }
}
```

#### 10. Lawyer
```json
{
  "category": "LAWYER",
  "metadata": {
    "linkedinUrl": "https://...",
    "barLicenseNumber": "AB123456",
    "jurisdiction": "New York",
    "specialization": "Corporate Law"
  }
}
```

#### 11. HR Specialist
```json
{
  "category": "HR_SPECIALIST",
  "metadata": {
    "linkedinUrl": "https://...",
    "resumeUrl": "https://...",
    "certifications": ["SHRM-CP"]
  }
}
```

#### 12. Data Analyst
```json
{
  "category": "DATA_ANALYST",
  "metadata": {
    "githubUrl": "https://...",
    "portfolioUrl": "https://...",
    "tools": ["Python", "Tableau", "SQL"],
    "topProjects": [...] // Array of 2 Project Objects
  }
}
```

---

## 🚨 Error Handling

The backend returns standardized errors.

- **400 Bad Request**: Validation failed (e.g., missing specific metadata field).
  - Response: `{ "status": "fail", "message": "Validation Error: metadata.githubUrl is required" }`
- **401 Unauthorized**: Invalid or missing Token.
- **403 Forbidden**: User tried to access dashboard without completing onboarding.

## 🛡️ Best Practices for Integration

### 1. Unified API Client
Create a shared Axios or Fetch wrapper that automatically attaches the JWT from storage.

### 2. Form Strategy
Use **React Hook Form** + **Zod** (frontend version) to validate before sending. Match the constraints in `src/validators/auth.validator.ts` to avoid 400 errors from the backend.

### 3. Image Uploads (Coming Soon)
Profile images and proof-of-work assets will likely use S3 or Cloudinary. For now, use URL strings as placeholders.

## 🧪 Testing

1.  **Swagger UI**: Visit `https://proven-backend.onrender.com/api-docs` (Production) or `http://localhost:5000/api-docs` (Local) to test APIs manually.
2.  **Mocking**: Use the provided JSON structures in this guide to build your mock data and UI states before the backend is fully wired up.

---
*ProTip: Check the `SWAGGER_TESTING_GUIDE.md` for a step-by-step walkthrough of the expected request/response flow.*
