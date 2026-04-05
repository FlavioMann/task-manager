import { FastifyInstance } from "fastify";
import z from "zod";
import { prisma } from "../lib/prisma.js";
import { deleteTaskDoc } from "../docs/task-swagger.js";

export async function deleteTaskRoute(app: FastifyInstance) {
  app.delete("/tasks/:id", deleteTaskDoc, async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply
        .status(401)
        .send({ message: "Não autorizado. Faça login novamente." });
    }

    try {
      const paramsSchema = z.object({
        id: z.string().uuid("ID da tarefa inválido"),
      });

      const { id } = paramsSchema.parse(request.params);
      const userId = request.user.sub;

      const task = await prisma.task.findFirst({
        where: { id, ownerId: userId },
      });

      if (!task) {
        return reply.status(404).send({
          message:
            "Tarefa não encontrada ou você não tem permissão para excluí-la.",
        });
      }

      await prisma.task.delete({ where: { id } });

      return reply.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply
          .status(400)
          .send({ message: "Erro de validação", errors: error.format() });
      }
      return reply
        .status(500)
        .send({ message: "Erro interno ao excluir tarefa." });
    }
  });
}
