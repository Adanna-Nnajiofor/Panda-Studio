import jwt from 'jsonwebtoken';
import type { TokenPayload, UserRole } from '../types/auth';
import logger from './logger';

const JWT_ALGORITHM: jwt.Algorithm = 'HS256';
const MIN_SECRET_LENGTH = 32;

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (typeof secret === 'string' && secret.trim().length > 0) {
    const trimmed = secret.trim();
    
    if (process.env.NODE_ENV === 'production' && trimmed.length < MIN_SECRET_LENGTH) {
      throw new Error(`[jwt] JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production.`);
    }
    
    return trimmed;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('[jwt] JWT_SECRET must be set in production environment.');
  }

  logger.warn('[jwt] Using weak default JWT_SECRET in development. Set JWT_SECRET in .env for production.');
  return 'dev-secret-change-me-minimum-32-chars-long';
};

const getJwtExpiresIn = (): jwt.SignOptions['expiresIn'] => {
  const expiresIn = process.env.JWT_EXPIRES_IN;

  if (typeof expiresIn === 'string' && expiresIn.trim().length > 0) {
    return expiresIn.trim() as jwt.SignOptions['expiresIn'];
  }

  return '7d';
};

export const generateToken = (payload: { id: string; role: UserRole }): string => {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: getJwtExpiresIn(),
    issuer: 'panda-studio-api',
    audience: 'panda-studio-client',
  });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, getJwtSecret(), {
    algorithms: [JWT_ALGORITHM],
    issuer: 'panda-studio-api',
    audience: 'panda-studio-client',
  }) as TokenPayload;
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
};