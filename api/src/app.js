import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import routes from './routes/notes.router.js';
import authMiddleware from './middleware/auth.js';
import { apiRateLimiter } from './middleware/rateLimit.js';



const app = express();

// Middleware
app.use(cors()); // allow cross-origin requests
app.use(helmet()); 
app.use(express.json()); // parse JSON body
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/notes', apiRateLimiter, authMiddleware, routes);

// Health check route
app.get('/health', apiRateLimiter, (req, res) => {
  res.status(200).json({ ok: true, message: 'Server is running' });
});

export default app;
