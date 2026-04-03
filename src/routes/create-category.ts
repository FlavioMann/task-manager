import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { createCategoryDoc } from "../docs/category-swagger.js";

export async function createCategoryRoute(app: FastifyInstance) {
  app.post("/categories", createCategoryDoc, async (request, reply) => {
    try {
      await request.jwtVerify();

      const createCategorySchema = z.object({
        name: z
          .string()
          .min(2, "O nome da categoria deve ter no mínimo 2 caracteres"),
      });

      const { name } = createCategorySchema.parse(request.body);
      const userId = request.user.sub;

      const category = await prisma.category.create({
        data: {
          name,
          ownerId: userId,
        },
      });

      return reply.status(201).send({ categoryId: category.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply
          .status(400)
          .send({ message: "Erro de validação", errors: error.format() });
      }

      return reply.status(400).send({ message: "Esta categoria já existe." });
    }
  });
}
