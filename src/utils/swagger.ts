import type { Express, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';

/** @note In production, consider automated schema generation. */

// Dynamically determine the API server URL based on the environment.
const API_URL = process.env.NODE_ENV === 'production'
    ? 'https://proven-backend.onrender.com'
    : `http://localhost:${process.env.PORT || 5000}`;

const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'ProVen API Docs',
        version: '1.0.0',
        description: 'API Documentation for ProVen Vetting System',
    },
    servers: [
        {
            url: '/',
            description: 'ProVen API (Current Host)',
        },
    ],

    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
    paths: {
        '/api/auth/register': {
            post: {
                summary: 'Register a new user',
                tags: ['Authentication'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                    username: { type: 'string' },
                                    password: { type: 'string', minLength: 8 },
                                    role: { type: 'string', enum: ['CLIENT', 'PROFESSIONAL', 'ADMIN'] },
                                    phone: { type: 'string' }
                                },
                                required: ['email', 'password', 'role']
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'User registered successfully' },
                    400: { description: 'User already exists' }
                }
            }
        },
        '/api/auth/verify-otp': {
            post: {
                summary: 'Verify Email with OTP',
                tags: ['Authentication'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                    code: { type: 'string' }
                                },
                                required: ['email', 'code']
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Email verified successfully' },
                    400: { description: 'Invalid OTP' }
                }
            }
        },
        '/api/auth/login': {
            post: {
                summary: 'Login User',
                tags: ['Authentication'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                    password: { type: 'string' }
                                },
                                required: ['email', 'password']
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Login successful' },
                    401: { description: 'Invalid credentials' }
                }
            }
        },
        '/api/auth/resend-otp': {
            post: {
                summary: 'Resend Verification OTP',
                tags: ['Authentication'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    email: { type: 'string', format: 'email' }
                                },
                                required: ['email']
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'OTP resent successfully' },
                    404: { description: 'User not found' }
                }
            }
        },
        '/api/auth/social-login': {
            post: {
                summary: 'Social Login/Signup (Google/Facebook)',
                tags: ['Authentication'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                    name: { type: 'string' },
                                    provider: { type: 'string', enum: ['google', 'facebook'] },
                                    providerId: { type: 'string' },
                                    image: { type: 'string' }
                                },
                                required: ['email', 'name', 'provider', 'providerId']
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Social login successful' },
                    400: { description: 'Invalid social data' }
                }
            }
        },
        '/api/auth/test-email': {
            post: {
                summary: 'Diagnostic: Send a test OTP email (Sync)',
                tags: ['Authentication'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    email: { type: 'string', format: 'email' }
                                },
                                required: ['email']
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Test email request processed' },
                    500: { description: 'SMTP Error' }
                }
            }
        },

        '/api/auth/complete-profile': {
            post: {
                summary: 'Submit Professional Profile for Vetting',
                tags: ['Authentication'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    userId: { type: 'string' },
                                    category: { type: 'string', enum: ['SOFTWARE_DEVELOPER', 'PROJECT_MANAGER', '...'] },
                                    firstName: { type: 'string' },
                                    lastName: { type: 'string' },
                                    bio: { type: 'string' },
                                    metadata: {
                                        type: 'object',
                                        description: 'Category-specific fields (GitHub, Portfolio, etc.)'
                                    }
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Profile submitted successfully' },
                    400: { description: 'Validation Error (Missing resume, portfolio, etc.)' },
                    401: { description: 'Unauthorized' },
                },
            },
        },
        '/api/notifications': {
            get: {
                summary: 'Get User Notifications',
                tags: ['Notifications'],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Notifications retrieved successfully' },
                    401: { description: 'Unauthorized' }
                }
            }
        },
        '/api/notifications/{id}/read': {
            patch: {
                summary: 'Mark Notification as Read',
                tags: ['Notifications'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Notification marked as read' },
                    404: { description: 'Notification not found' }
                }
            }
        },
        '/api/notifications/read-all': {
            patch: {
                summary: 'Mark All Notifications as Read',
                tags: ['Notifications'],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'All notifications marked as read' }
                }
            }
        },
        '/api/contact': {
            post: {
                summary: 'Handle Contact Form Submissions',
                tags: ['Contact'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name', 'email', 'subject', 'message'],
                                properties: {
                                    name: { type: 'string' },
                                    email: { type: 'string', format: 'email' },
                                    subject: { type: 'string' },
                                    message: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Inquiry received' },
                    400: { description: 'Validation error' }
                }
            }
        },
        '/api/profile/me': {
            get: {
                summary: 'Get Current User Profile',
                tags: ['Profile'],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'User profile retrieved successfully' },
                    401: { description: 'Unauthorized' }
                }
            }
        },
        '/api/profile/dashboard': {
            get: {
                summary: 'Access Professional Dashboard',
                tags: ['Profile'],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Access granted' },
                    403: { description: 'Forbidden: Onboarding incomplete' }
                }
            }
        },
        '/api/projects': {
            post: {
                summary: 'Create a Standard Project',
                tags: ['Projects'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string' },
                                    description: { type: 'string' },
                                    targetAudience: { type: 'string' },
                                    industry: { type: 'array', items: { type: 'string' } },
                                    requirements: { type: 'string' },
                                    specificNotes: { type: 'string' },
                                    budgetRange: { type: 'string', enum: ["FROM_5K_TO_10K", "FROM_10K_TO_25K", "FROM_25K_TO_50K", "ABOVE_50K", "LESS_THAN_5K"] },
                                    timeline: { type: 'string', enum: ["LESS_THAN_1_MONTH", "FROM_1_TO_3_MONTHS", "FROM_3_TO_6_MONTHS", "ABOVE_6_MONTHS"] },
                                    coverImageUrl: { type: 'string', format: 'url' }
                                },
                                required: ['title', 'description', 'targetAudience', 'industry', 'requirements', 'budgetRange', 'timeline']
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Project created successfully' },
                    401: { description: 'Unauthorized' }
                }
            }
        },
        '/api/projects/{id}': {
            get: {
                summary: 'Get Project Details',
                tags: ['Projects'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Project details retrieved' },
                    404: { description: 'Project not found' }
                }
            },
            patch: {
                summary: 'Update a Standard Project',
                tags: ['Projects'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string' },
                                    description: { type: 'string' },
                                    targetAudience: { type: 'string' },
                                    industry: { type: 'array', items: { type: 'string' } },
                                    requirements: { type: 'string' },
                                    specificNotes: { type: 'string' },
                                    budgetRange: { type: 'string' },
                                    timeline: { type: 'string' },
                                    coverImageUrl: { type: 'string', format: 'url' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Project updated successfully' },
                    401: { description: 'Unauthorized' }
                }
            }
        },
        '/api/projects/check-title': {
            get: {
                summary: 'Check Project Title Availability',
                tags: ['Projects'],
                parameters: [{ in: 'query', name: 'title', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Availability status returned' }
                }
            }
        },
        '/api/projects/my-missions': {
            get: {
                summary: 'Get My Missions (Professionals)',
                tags: ['Projects'],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Missions retrieved successfully' },
                    401: { description: 'Unauthorized' }
                }
            }
        },
        '/api/projects/{id}/interest': {
            post: {
                summary: 'Express Interest in a Project',
                tags: ['Projects'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Interest expressed successfully' },
                    400: { description: 'Already expressed interest or not vetted' }
                }
            }
        },
        '/api/projects/pitches': {
            post: {
                summary: 'Create an Investment Pitch',
                tags: ['Projects'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    problemStatement: { type: 'string' },
                                    proposedSolution: { type: 'string' },
                                    usp: { type: 'string' },
                                    marketSize: { type: 'string' },
                                    traction: { type: 'string' },
                                    competitors: { type: 'string' },
                                    fundingAmount: { type: 'string' },
                                    equityOffered: { type: 'string' },
                                    useOfFunds: { type: 'string' },
                                    pitchDeckUrl: { type: 'string', format: 'url' },
                                    businessPlanUrl: { type: 'string', format: 'url' }
                                },
                                required: ['problemStatement', 'proposedSolution', 'usp', 'marketSize', 'fundingAmount', 'equityOffered', 'useOfFunds', 'pitchDeckUrl']
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Investment pitch created successfully' },
                    401: { description: 'Unauthorized' }
                }
            }
        },
        '/api/projects/my-submissions': {
            get: {
                summary: 'Get My Project Submissions',
                tags: ['Projects'],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Submissions retrieved successfully' },
                    401: { description: 'Unauthorized' }
                }
            }
        },
        '/api/projects/feed': {
            get: {
                summary: 'Get Accepted Projects Feed (Professionals)',
                tags: ['Projects'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
                    { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } }
                ],
                responses: {
                    200: { description: 'Feed projects retrieved successfully' },
                    401: { description: 'Unauthorized' }
                }
            }
        },
        '/api/admin/projects': {
            get: {
                summary: 'Get All Projects (Admin)',
                tags: ['Admin'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: 'query', name: 'status', schema: { type: 'string', enum: ['PENDING', 'REVIEWING', 'ACCEPTED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED'] } },
                    { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
                    { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } }
                ],
                responses: {
                    200: { description: 'Projects retrieved successfully' },
                    403: { description: 'Forbidden: Admin only' }
                }
            }
        },
        '/api/admin/projects/{id}/status': {
            patch: {
                summary: 'Update Project Status',
                tags: ['Admin'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    status: { type: 'string', enum: ['PENDING', 'REVIEWING', 'ACCEPTED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED'] }
                                },
                                required: ['status']
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Project status updated' },
                    403: { description: 'Forbidden: Admin only' },
                    404: { description: 'Project not found' }
                }
            }
        },
        '/api/admin/projects/{id}/assign': {
            post: {
                summary: 'Assign Professional to Project',
                tags: ['Admin'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    professionalId: { type: 'string' },
                                    role: { type: 'string', example: 'Lead Developer' }
                                },
                                required: ['professionalId']
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Professional assigned successfully' },
                    400: { description: 'Invalid professional or not vetted' },
                    403: { description: 'Forbidden: Admin only' }
                }
            }
        },
        '/api/admin/users': {
            get: {
                summary: 'Get All Users (Admin)',
                tags: ['Admin'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: 'query', name: 'role', schema: { type: 'string', enum: ['CLIENT', 'PROFESSIONAL', 'ADMIN'] } },
                    { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
                    { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } }
                ],
                responses: {
                    200: { description: 'Users retrieved successfully' },
                    403: { description: 'Forbidden: Admin only' }
                }
            }
        },
        '/api/admin/users/stats': {
            get: {
                summary: 'Get User Statistics (Admin)',
                tags: ['Admin'],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Statistics retrieved successfully' },
                    403: { description: 'Forbidden: Admin only' }
                }
            }
        },
        '/api/admin/professionals/pending': {
            get: {
                summary: 'Get Pending Professionals for Vetting (Admin)',
                tags: ['Admin'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
                    { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } }
                ],
                responses: {
                    200: { description: 'Professionals retrieved successfully' },
                    403: { description: 'Forbidden: Admin only' }
                }
            }
        },
        '/api/admin/professionals/{id}/vet': {
            patch: {
                summary: 'Vet/Unvet Professional (Admin)',
                tags: ['Admin'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    status: { type: 'string', enum: ['VETTED', 'REJECTED'] },
                                    remarks: { type: 'string' }
                                },
                                required: ['status']
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Professional status updated' },
                    403: { description: 'Forbidden: Admin only' },
                    404: { description: 'Professional not found' }
                }
            }
        },
        '/api/admin/projects/{id}/meeting': {
            post: {
                summary: 'Schedule Project Meeting (Admin)',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Project ID' }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string' },
                                    description: { type: 'string' },
                                    meetingLink: { type: 'string' },
                                    startTime: { type: 'string', format: 'date-time' },
                                    endTime: { type: 'string', format: 'date-time' },
                                    duration: { type: 'string', example: '45 mins' },
                                    attendeeIds: { type: 'array', items: { type: 'string' } }
                                },
                                required: ['title', 'meetingLink', 'startTime']
                            }
                        }
                    }
                },
                responses: { 201: { description: 'Meeting scheduled' }, 404: { description: 'Project not found' } }
            }
        },
        '/api/admin/projects/{id}/meetings': {
            get: {
                summary: 'Get Project Meetings (Admin)',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Project ID' }],
                responses: { 200: { description: 'Meetings retrieved' }, 404: { description: 'Project not found' } }
            }
        },
        '/api/admin/projects/{id}/document': {
            post: {
                summary: 'Add Project Document (Admin)',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Project ID' }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string' },
                                    url: { type: 'string' },
                                    type: { type: 'string', enum: ['SRS', 'SPRINT', 'DELIVERABLE', 'DOC'] },
                                    description: { type: 'string' },
                                    professionalIds: { type: 'array', items: { type: 'string' } }
                                },
                                required: ['title', 'url']
                            }
                        }
                    }
                },
                responses: { 201: { description: 'Document added' }, 404: { description: 'Project not found' } }
            }
        },
        '/api/admin/projects/{id}/documents': {
            get: {
                summary: 'Get Project Documents (Admin)',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Project ID' }],
                responses: { 200: { description: 'Documents retrieved' }, 404: { description: 'Project not found' } }
            }
        },
        '/api/admin/projects/{id}/task': {
            post: {
                summary: 'Assign Project Task (Admin)',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Project ID' }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string' },
                                    description: { type: 'string' },
                                    status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'DO_AGAIN', 'CANCELLED'] },
                                    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
                                    dueDate: { type: 'string', format: 'date-time' },
                                    professionalIds: { type: 'array', items: { type: 'string' } },
                                    duration: { type: 'string', example: '2 weeks' },
                                    richText: { type: 'string', description: 'HTML or JSON rich text data' }
                                },
                                required: ['title']
                            }
                        }
                    }
                },
                responses: { 201: { description: 'Task assigned' }, 404: { description: 'Project not found' } }
            }
        },
        '/api/admin/tasks/{id}/review': {
            patch: {
                summary: 'Review Project Task (Admin)',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Task ID' }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    feedback: { type: 'string' },
                                    status: { type: 'string', enum: ['DONE', 'DO_AGAIN', 'CANCELLED'] }
                                },
                                required: ['status']
                            }
                        }
                    }
                },
                responses: { 200: { description: 'Task reviewed' }, 404: { description: 'Task not found' } }
            }
        },
        '/api/professional/tasks/{id}/report': {
            post: {
                summary: 'Report Project Task (Professional)',
                tags: ['Professional Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Task ID' }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    content: { type: 'string' },
                                    media: { type: 'array', items: { type: 'string' }, description: 'Links to images/videos' },
                                    links: { type: 'array', items: { type: 'string' }, description: 'External links' }
                                },
                                required: ['content']
                            }
                        }
                    }
                },
                responses: { 200: { description: 'Task reported' }, 404: { description: 'Task not found' } }
            }
        },
        '/api/admin/projects/{id}/tasks': {
            get: {
                summary: 'Get Project Tasks (Admin)',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Project ID' }],
                responses: { 200: { description: 'Tasks retrieved' }, 404: { description: 'Project not found' } }
            }
        },
        '/api/admin/projects/{id}/info': {
            get: {
                summary: 'Get Project Info/Dossier (Admin)',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Project ID' }],
                responses: { 200: { description: 'Project info retrieved' }, 404: { description: 'Project not found' } }
            },
            post: {
                summary: 'Add Project Info/Dossier (Admin)',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Project ID' }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string' },
                                    content: { type: 'string' },
                                    professionalIds: { type: 'array', items: { type: 'string' } }
                                },
                                required: ['title', 'content']
                            }
                        }
                    }
                },
                responses: { 201: { description: 'Info added' }, 404: { description: 'Project not found' } }
            }
        },
        '/api/admin/projects/{id}/resources': {
            get: {
                summary: 'Get Project Resources (Admin)',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Project ID' }],
                responses: { 200: { description: 'Resources retrieved' }, 404: { description: 'Project not found' } }
            },
            post: {
                summary: 'Add Project Resource (Admin)',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Project ID' }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string' },
                                    url: { type: 'string' },
                                    type: { type: 'string', enum: ['LINK', 'FILE'] },
                                    platform: { type: 'string', enum: ['GITHUB', 'FIGMA', 'JIRA', 'TRELLO', 'OTHER'] },
                                    description: { type: 'string' }
                                },
                                required: ['title', 'url']
                            }
                        }
                    }
                },
                responses: { 201: { description: 'Resource added' }, 404: { description: 'Project not found' } }
            }
        },
        '/api/admin/projects/{id}/updates': {
            get: {
                summary: 'Get Project Updates (Admin)',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Project ID' }],
                responses: { 200: { description: 'Updates retrieved' }, 404: { description: 'Project not found' } }
            },
            post: {
                summary: 'Add Project Update/Briefing (Admin)',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Project ID' }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string' },
                                    content: { type: 'string' },
                                    isUrgent: { type: 'boolean', default: false }
                                },
                                required: ['title', 'content']
                            }
                        }
                    }
                },
                responses: { 201: { description: 'Update added' }, 404: { description: 'Project not found' } }
            }
        },
        '/api/admin/projects/{id}/interests': {
            get: {
                summary: 'Get Project Interests',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Project interests retrieved' }
                }
            }
        },
        '/api/admin/interests': {
            get: {
                summary: 'List All Expressed Interests',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Interests retrieved' }
                }
            }
        },
        '/api/admin/interests/{id}': {
            delete: {
                summary: 'Delete an Interest',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Interest deleted' }
                }
            }
        },
        '/api/admin/resources/{id}': {
            put: {
                summary: 'Update a Resource',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Resource updated' } }
            },
            delete: {
                summary: 'Delete a Resource',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Resource deleted' } }
            }
        },
        '/api/admin/updates/{id}': {
            put: {
                summary: 'Update Project Update',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Update modified' } }
            },
            delete: {
                summary: 'Delete Project Update',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Update deleted' } }
            }
        },
        '/api/admin/meeting/{id}': {
            put: {
                summary: 'Update a Meeting',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Meeting updated' } }
            },
            delete: {
                summary: 'Delete a Meeting',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Meeting deleted' } }
            }
        },
        '/api/admin/document/{id}': {
            put: {
                summary: 'Update a Document',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Document updated' } }
            },
            delete: {
                summary: 'Delete a Document',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Document deleted' } }
            }
        },
        '/api/admin/task/{id}': {
            put: {
                summary: 'Update a Task',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Task updated' } }
            },
            delete: {
                summary: 'Delete a Task',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Task deleted' } }
            }
        },
        '/api/admin/info/{id}': {
            put: {
                summary: 'Update Project Info',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Info updated' } }
            },
            delete: {
                summary: 'Delete Project Info',
                tags: ['Admin Workspace'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Info deleted' } }
            }
        },
        '/api/projects/{projectId}/sprints': {
            get: {
                summary: 'Get Project Sprints',
                tags: ['Sprints'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'projectId', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Project sprints retrieved' } }
            }
        },
        '/api/admin/projects/{projectId}/sprint': {
            post: {
                summary: 'Create Project Sprint (Admin)',
                tags: ['Admin Sprints'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'projectId', required: true, schema: { type: 'string' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string' },
                                    description: { type: 'string' },
                                    deliverables: { type: 'string' },
                                    projectWeight: { type: 'number', description: '0-100 percentage' },
                                    progress: { type: 'number', description: '0-100 percentage' },
                                    status: { type: 'string', enum: ['PLANNED', 'ACTIVE', 'COMPLETED', 'ON_HOLD'] },
                                    duration: { type: 'string', example: '1 month' },
                                    richText: { type: 'string', description: 'HTML or JSON rich text data' }
                                },
                                required: ['title']
                            }
                        }
                    }
                },
                responses: { 201: { description: 'Sprint created' }, 404: { description: 'Project not found' } }
            }
        },
        '/api/admin/sprint/{id}': {
            put: {
                summary: 'Update Sprint (Admin)',
                tags: ['Admin Sprints'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string' },
                                    description: { type: 'string' },
                                    deliverables: { type: 'string' },
                                    projectWeight: { type: 'number' },
                                    progress: { type: 'number' },
                                    status: { type: 'string', enum: ['PLANNED', 'ACTIVE', 'COMPLETED', 'ON_HOLD'] },
                                    duration: { type: 'string' },
                                    richText: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: { 200: { description: 'Sprint updated' } }
            },
            delete: {
                summary: 'Delete Sprint (Admin)',
                tags: ['Admin Sprints'],
                security: [{ bearerAuth: [] }],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Sprint deleted' } }
            }
        }
    },
};

export const setupSwagger = (app: Express) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    app.get('/api-docs.json', (req: Request, res: Response) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerDocument);
    });

    console.log(`Swagger Docs available at ${API_URL}/api-docs`);
};
