import dotenv from 'dotenv';
dotenv.config();

export interface AppConfig {
  port: number;
  jwtSecret: string;
  jwtRefreshSecret: string;
  digilockerClientId: string;
  groqApiKey: string;
  nodeEnv: string;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'trafficmitra-production-secret-key-2026',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'trafficmitra-refresh-token-key-2026',
  digilockerClientId: process.env.DIGILOCKER_SANDBOX_CLIENT_ID || 'NMC_TRAFFICMITRA_SB_01',
  groqApiKey: process.env.GROQ_API_KEY || '',
  nodeEnv: process.env.NODE_ENV || 'development'
};

if (!config.groqApiKey) {
  console.warn('⚠️ [Config] GROQ_API_KEY is not configured in .env. Groq chatbot service will use internal fallback mode.');
} else {
  console.log('⚡ [Config] Groq API Key successfully configured and loaded for LPU inference.');
}
