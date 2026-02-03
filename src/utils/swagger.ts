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
            url: API_URL,
            description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server',
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
