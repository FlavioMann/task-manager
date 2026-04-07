import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { getCategoryByIdDoc } from "../docs/category-swagger.js";

export async function getCategoryByIdRoute(app: FastifyInstance) {
  app.get("/categories/:id", getCategoryByIdDoc, async (request, reply) => {
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

    const category = await prisma.category.findFirst({
      where: { id, ownerId: userId },
      select: {
        id: true,
        name: true,
        tasks: {
          select: { id: true, title: true, status: true },
        },
      },
    });

    if (!category) {
      return reply.status(404).send({ message: "Categoria não encontrada." });
    }

    return reply.status(200).send({ category });
  });
}
