import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

// Choose AI provider based on environment variable
export function getAIModel() {
  const provider = process.env.AI_PROVIDER || 'openai';
  
  if (provider === 'google' && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return google('gemini-pro');
  }
  
  return openai('gpt-4-turbo');
}

export const AI_RATE_LIMITS = {
  free: 10, // requests per hour
  pro: 100,
  admin: Infinity,
};

export function getRateLimit(userRole: string): number {
  switch (userRole) {
    case 'admin':
      return AI_RATE_LIMITS.admin;
    case 'manager':
      return AI_RATE_LIMITS.pro;
    default:
      return AI_RATE_LIMITS.free;
  }
}