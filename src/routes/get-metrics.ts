import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { getMetricsDoc } from "../docs/metrics-swagger.js";

export async function getMetricsRoute(app: FastifyInstance) {
  app.get("/metrics", getMetricsDoc, async (request, reply) => {
    try {
      await request.jwtVerify();
      const userId = request.user.sub;

      const [totalTasks, completedTasks, tasksByCategory] = await Promise.all([
        prisma.task.count({
          where: { ownerId: userId },
        }),

        prisma.task.count({
          where: {
            ownerId: userId,
            status: "COMPLETED",
          },
        }),

        prisma.task.groupBy({
          by: ["categoryId"],
          where: { ownerId: userId },
          _count: {
            id: true,
          },
        }),
      ]);

      const progressPercentage =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return reply.send({
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        progressPercentage: `${progressPercentage}%`,
        tasksByCategory,
      });
    } catch (error) {
      return reply
        .status(500)
        .send({ message: "Erro ao gerar relatório de progresso." });
    }
  });
}
