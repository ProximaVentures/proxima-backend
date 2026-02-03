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

// CORS Configuration - Must be before other middleware
const corsOptions = {
    origin: '*', // Allow all origins for now (can be restricted later)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200, // For legacy browser support
};

// Apply CORS first, then other middleware
app.use(cors(corsOptions));


// Security headers (with relaxed settings for API)
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'unsafe-none' },
}));

app.use(morgan('dev')); // Logs requests for debugging
app.use(express.json()); // Parses JSON bodies


// ROOT API ENDPOINT
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to ProVen API',
        version: '1.0.0',
        docs: '/api-docs',
        health: '/health',
    });
});

app.get('/api', (req, res) => {
    res.status(200).json({
        message: 'ProVen API v1',
        endpoints: {
            auth: '/api/auth',
            profile: '/api/profile',
            admin: '/api/admin',
        },
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
