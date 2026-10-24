import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { User, UserRole, SectionPermissions } from '../types';

export interface AuthenticatedUser extends User {}

// In-memory sessions map: token -> { user: AuthenticatedUser, expiresAt: number }
const sessions = new Map<string, { user: AuthenticatedUser; expiresAt: number }>();
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createSession(user: AuthenticatedUser): string {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, {
    user,
    expiresAt: Date.now() + SESSION_TTL,
  });
  return token;
}

export function getSessionUser(token: string): AuthenticatedUser | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session.user;
}

export function destroySession(token: string) {
  sessions.delete(token);
}

export function updateSessionUser(userId: string, updated: Partial<AuthenticatedUser>) {
  for (const [token, session] of sessions.entries()) {
    if (session.user.id === userId) {
      session.user = { ...session.user, ...updated };
    }
  }
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Accès non autorisé. Authentification requise.' });
  }

  const token = authHeader.split(' ')[1];
  const user = getSessionUser(token);
  if (!user) {
    return res.status(401).json({ error: 'Session expirée ou invalide. Veuillez vous reconnecter.' });
  }

  req.user = user;
  next();
}

export function requireDeveloper(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'developer') {
      return res.status(403).json({ error: 'Accès refusé. Cette section est strictement réservée au Développeur.' });
    }
    next();
  });
}

export function checkSectionPermission(sectionKey: keyof SectionPermissions) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    requireAuth(req, res, () => {
      // Developer has bypass access to all sections
      if (req.user?.role === 'developer') {
        return next();
      }

      // Admin access depends on Developer permissions config
      const permissions = db.get('permissions');
      if (!permissions[sectionKey]) {
        return res.status(403).json({
          error: `Accès révoqué. La section "${sectionKey}" a été désactivée par le Développeur.`,
          section: sectionKey,
        });
      }

      next();
    });
  };
}
