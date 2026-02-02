# ProVen Frontend Integration Guide

This document guides the Frontend Team on how to integrate with the ProProven Backend, specifically focusing on the Authentication and Onboarding flow.

---

## 🔗 Base URL
`http://localhost:5000/api` (Local)

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

### 2. Verify OTP
- **Endpoint**: `POST /auth/verify-otp`
- **Body**: `{ "email": "john@example.com", "code": "123456" }`
- **Response**: `200 OK`. User is now verified.

### 3. Login
- **Endpoint**: `POST /auth/login`
- **Response**:
  ```json
  {
    "token": "eyJhbG...",
    "data": { "user": { "id": "...", "onboardingComplete": false } }
  }
  ```
- **Front-End Action**: Store `token` in `localStorage` or `cookies`. If `onboardingComplete` is `false` AND role is `PROFESSIONAL`, **redirect to `/onboarding`**.

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

## 🧪 Testing

1.  **Swagger UI**: Visit `http://localhost:5000/api-docs` to test APIs manually.
2.  **Types**: We use **Zod** on the backend. You can copy the types from `auth.validator.ts` to ensure your frontend forms match perfectly.
