import { z } from 'zod';
import logger from '../utils/logger';

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  PASSWORD_SALT_ROUNDS: z.string().transform((val) => parseInt(val, 10)).default('12'),
  AI_SERVICE_URL: z.string().url().default('http://localhost:8000')
});

export type EnvConfig = z.infer<typeof envSchema>;

let validatedEnv: EnvConfig;

export function validateEnvOnStartup(): EnvConfig {
  if (validatedEnv) return validatedEnv;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    logger.error('CRITICAL: Environment variable validation failed on startup:');
    result.error.issues.forEach((issue) => {
      logger.error(`  - Env [${issue.path.join('.')}]: ${issue.message}`);
    });
    console.error('Environment validation failed. Server exiting.');
    process.exit(1);
  }

  validatedEnv = result.data;
  logger.info('Environment variables validated successfully.');
  return validatedEnv;
}

export { validatedEnv as env };
