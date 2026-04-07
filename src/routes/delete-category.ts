import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { deleteCategoryDoc } from "../docs/category-swagger.js";

export async function deleteCategoryRoute(app: FastifyInstance) {
  app.delete("/categories/:id", deleteCategoryDoc, async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply
        .status(401)
        .send({ message: "Não autorizado. Faça login novamente." });
    }

    const paramsSchema = z.object({
      id: z.string().uuid("ID inválido"),
    });

    const parsed = paramsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ message: "ID inválido", errors: parsed.error.format() });
    }

    const { id } = parsed.data;
    const userId = request.user.sub;

    const existing = await prisma.category.findFirst({
      where: { id, ownerId: userId },
    });

    if (!existing) {
      return reply.status(404).send({ message: "Categoria não encontrada." });
    }

    await prisma.category.delete({ where: { id } });

    return reply.status(204).send();
  });
}
