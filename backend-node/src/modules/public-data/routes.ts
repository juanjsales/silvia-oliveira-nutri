import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { lookupPostalCode } from '../../shared/public-data.js';

export async function publicDataRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAdmin);
  app.get('/postal-code/:postalCode', async (request, reply) => {
    const { postalCode } = z.object({ postalCode: z.string().regex(/^\d{5}-?\d{3}$/) }).parse(request.params);
    const address = await lookupPostalCode(postalCode);
    if (!address) return reply.code(404).send({ error: 'CEP não encontrado. Continue o preenchimento manualmente.' });
    return { data: address };
  });
}
