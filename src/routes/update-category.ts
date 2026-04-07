import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { updateCategoryDoc } from "../docs/category-swagger.js";

export async function updateCategoryRoute(app: FastifyInstance) {
  app.patch("/categories/:id", updateCategoryDoc, async (request, reply) => {
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

    const parsedParams = paramsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply
        .status(400)
        .send({ message: "ID inválido", errors: parsedParams.error.format() });
    }

    const bodySchema = z.object({
      name: z
        .string()
        .min(2, "O nome da categoria deve ter no mínimo 2 caracteres"),
    });

    const parsedBody = bodySchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.status(400).send({
        message: "Erro de validação",
        errors: parsedBody.error.format(),
      });
    }

    const { id } = parsedParams.data;
    const { name } = parsedBody.data;
    const userId = request.user.sub;

    const existing = await prisma.category.findFirst({
      where: { id, ownerId: userId },
    });

    if (!existing) {
      return reply.status(404).send({ message: "Categoria não encontrada." });
    }

    try {
      const category = await prisma.category.update({
        where: { id },
        data: { name },
        select: { id: true, name: true },
      });

      return reply.status(200).send({ category });
    } catch {
      return reply
        .status(400)
        .send({ message: "Já existe uma categoria com esse nome." });
    }
  });
}
