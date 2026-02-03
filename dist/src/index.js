import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';
// Professor's Tip: Centralized exports make imports cleaner.
// We'll create these files in the next sub-steps.
import { errorHandler } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { setupSwagger } from './utils/swagger.js';
const app = express();
const PORT = process.env.PORT || 5000;
// SECURITY & UTILS
app.use(helmet()); // Protects headers from common attacks
app.use(cors()); // Allows frontend to talk to backend
app.use(morgan('dev')); // Logs requests for debugging
app.use(express.json()); // Parses JSON bodies
// HEALTH CHECK
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});
// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
// ERROR HANDLING
app.use(errorHandler);
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Master Professor's Server running on http://localhost:${PORT}`);
        // Initialize Swagger
        setupSwagger(app);
    });
}
export default app;
//# sourceMappingURL=index.js.map