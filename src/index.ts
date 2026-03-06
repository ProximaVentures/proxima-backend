import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';

// Centralize module exports for cleaner entry point imports.
import { errorHandler, AppError } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import adminRoutes from './routes/admin.routes.js';
import projectRoutes from './routes/project.routes.js';
import contactRoutes from './routes/contact.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import { setupSwagger } from './utils/swagger.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1); // Trust first proxy (Render/Vercel)

// 🛡️ Rate Limiting - Prevent brute-force attacks
import { rateLimit } from 'express-rate-limit';
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes'
    }
});

// Apply rate limiting to all auth routes
app.use('/api/auth', authLimiter);

// 🌐 CORS Configuration - Restrictive Whitelist
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5000',
    'https://proventures.vercel.app',
    'https://proven-app.vercel.app',
    'https://proven-backend.onrender.com',
    'https://proxima-backend-drl6.onrender.com',
    'https://provenworld.com',
    'https://www.provenworld.com',
    'https://api.provenworld.com',
    ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
].map(origin => origin.trim());

app.use(cors({
    origin: (origin, callback) => {
        // 1. Allow mobile apps, curl, and same-origin server-side requests
        if (!origin) return callback(null, true);

        // 2. Check restrictive whitelist
        const isWhitelisted = allowedOrigins.some(allowedOrigin => {
            return allowedOrigin === origin || (origin.endsWith('.vercel.app') && !origin.includes('localhost'));
        });

        // 3. Environment-based relaxation
        const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

        if (isWhitelisted || isDev) {
            callback(null, true);
        } else {
            console.error(`[🚨 CORS BLOCK]: Origin ${origin} rejected. Whitelist: ${allowedOrigins.join(', ')}`);
            callback(new AppError('Not allowed by CORS', 403));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie']
}));

// Security headers (with relaxed settings for API documentation and cross-origin access)
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'unsafe-none' },
    contentSecurityPolicy: false, // Disable CSP for now to ensure Swagger UI works
}));

app.use(morgan('dev')); // Dev-style logging
app.use(express.json({ limit: '10kb' })); // Parses JSON bodies and limits size

// ROOT API ENDPOINT
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to ProVen API',
        version: '1.0.0',
        docs: '/api-docs',
        health: '/health',
        timestamp: new Date().toISOString()
    });
});

app.get('/api', (req, res) => {
    res.status(200).json({
        message: 'ProVen API v1',
        origin: req.headers.origin || 'unknown',
        host: req.headers.host || 'unknown',
        docs: '/api-docs',
    });
});

// HEALTH CHECK
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/notifications', notificationRoutes);

// SWAGGER DOCS - Setup before listen so it's available immediately
setupSwagger(app);

// ERROR HANDLING
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`ProVen API Server running on http://localhost:${PORT}`);
    });
}

export default app;
