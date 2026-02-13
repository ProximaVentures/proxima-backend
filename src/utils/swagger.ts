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
                                    budgetRange: { type: 'string', enum: ["<5k", "5k-10k", "10k-25k", "25k-50k", "50k+"] },
                                    timeline: { type: 'string', enum: ["<1_month", "1-3_months", "3-6_months", "6_months+"] }
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
        '/api/admin/projects': {
            get: {
                summary: 'Get All Projects (Admin)',
                tags: ['Admin'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: 'query', name: 'status', schema: { type: 'string', enum: ['PENDING', 'REVIEWING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED'] } },
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
                                    status: { type: 'string', enum: ['PENDING', 'REVIEWING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED'] }
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
