import type { Express, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';

// 🏫 Professor's Tip: Ideally, you'd generate this automatically from Zod schemas
// using a library like `zod-to-swagger` or `swagger-jsdoc`.
// For manual setup, we define the basic structure here.

const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'ProVen API Docs',
        version: '1.0.0',
        description: 'API Documentation for ProVen Vetting System',
    },
    servers: [
        {
            url: 'http://localhost:5000',
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
    },
};

export const setupSwagger = (app: Express) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    app.get('/api-docs.json', (req: Request, res: Response) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerDocument);
    });

    console.log(`📑 Swagger Docs available at http://localhost:5000/api-docs`);
};
