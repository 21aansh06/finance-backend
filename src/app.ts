import express, { Application } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { errorResponse } from './utils/response';
import { globalLimiter } from './config/rateLimiter';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app: Application = express();

// Middlewares
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));


app.use(globalLimiter);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

app.use('/', routes);

app.use('*', (req, res) => {
  errorResponse(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
});

// Global Error Handler
app.use(errorHandler);

export default app;
