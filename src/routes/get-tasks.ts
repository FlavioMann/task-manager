import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { getTasksDoc } from "../docs/task-swagger.js";

export async function getTasksRoute(app: FastifyInstance) {
  app.get("/tasks", getTasksDoc, async (request, reply) => {
    try {
      await request.jwtVerify();
      const userId = request.user.sub;

      const tasks = await prisma.task.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { collaborators: { some: { id: userId } } },
          ],
        },
        include: {
          category: {
            select: {
              name: true,
            },
          },
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
          collaborators: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return reply.send(tasks);
    } catch (error) {
      return reply
        .status(500)
        .send({ message: "Erro ao carregar lista de tarefas." });
    }
  });
}
