import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { getUserDoc } from "../docs/user-swagger.js";

export async function getUserRoute(app: FastifyInstance) {
  app.get("/users", getUserDoc, async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply
        .status(401)
        .send({ message: "Não autorizado. Faça login novamente." });
    }

    const userId = request.user.sub;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ message: "Usuário não encontrado." });
    }

    return reply.status(200).send({ user });
  });
}
