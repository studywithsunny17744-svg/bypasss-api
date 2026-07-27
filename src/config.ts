import dotenv from 'dotenv';
import path from 'path';

const localEnvPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: localEnvPath });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  masterApiKey: process.env.API_KEY || '',
  baseUrl: (process.env.BASE_URL || '').replace(/\/$/, ''),
  masterAdminId: process.env.MASTER_ADMIN_ID || '1457931837769908467',
  logWebhookUrl: process.env.LOG_WEBHOOK_URL || '',
  apiKeyPrefix: process.env.API_KEY_PREFIX || 'Mani272',
  appBrandName: process.env.APP_BRAND_NAME || 'Mani272 API',
  dbPath: process.env.DB_PATH || path.resolve(process.cwd(), 'database.json'),
  envPath: localEnvPath,
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin'
};
