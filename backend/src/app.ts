import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { originGuard } from './middleware/originGuard';
import { apiLimiter } from './middleware/rateLimit';
import routes from './routes';

export function createApp() {
  const app = express();

  // Render/Vercel/etc. terminate TLS in front of us; needed for correct client IPs + secure cookies.
  if (env.isProd) app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || env.corsOrigins.includes(origin.replace(/\/$/, ''))),
      credentials: true,
    }),
  );
  if (env.NODE_ENV !== 'test') app.use(morgan(env.isProd ? 'combined' : 'dev'));
  app.use(express.json({ limit: '50kb' }));
  app.use(cookieParser());

  app.use('/api', apiLimiter, originGuard, routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
