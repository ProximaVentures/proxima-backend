import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';

// Centralize module exports for cleaner entry point imports.
import { errorHandler } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { setupSwagger } from './utils/swagger.js';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration - Simple and reliable defaults for debugging
app.use(cors());

// Diagnostic Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Host: ${req.headers.host} - Origin: ${req.headers.origin}`);
    next();
});

// Security headers (with relaxed settings for API documentation and cross-origin access)
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'unsafe-none' },
    contentSecurityPolicy: false, // Disable CSP for now to ensure Swagger UI works
}));

app.use(morgan('dev')); // Dev-style logging
app.use(express.json()); // Parses JSON bodies

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
