import 'express';

declare global {
  namespace Express {
    interface Request {
      /** Authenticated administrator, set by the `authenticate` middleware. */
      admin?: { id: string; email: string; name: string };
      /** Parsed + coerced query string (Express 5 makes `req.query` read-only). */
      validatedQuery?: any;
      validatedParams?: any;
    }
  }
}

export {};
