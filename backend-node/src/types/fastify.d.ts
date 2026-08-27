import type { Database } from '../database/pool.js';
import type { AppEnv } from '../config/env.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: Database;
    env: AppEnv;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    hasPermission: (request: FastifyRequest, permission: string) => Promise<boolean>;
    hasExplicitPermission: (request: FastifyRequest, permission: string) => Promise<boolean>;
    requirePermission: (permission: string) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireExplicitPermission: (permission: string) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    auth: { sessionId: string; userId: string; role: 'ADMIN' | 'PATIENT' | 'NUTRITIONIST' | 'RECEPTIONIST'; patientId: string | null } | null;
  }
}

export {};
