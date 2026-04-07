import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { getCategoriesDoc } from "../docs/category-swagger.js";

export async function getCategoriesRoute(app: FastifyInstance) {
  app.get("/categories", getCategoriesDoc, async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply
        .status(401)
        .send({ message: "Não autorizado. Faça login novamente." });
    }

    const userId = request.user.sub;

    const categories = await prisma.category.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        _count: { select: { tasks: true } },
      },
    });

    return reply.status(200).send({ categories });
  });
}
