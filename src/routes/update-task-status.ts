import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { updateTaskStatusDoc } from "../docs/task-swagger.js";

export async function updateTaskStatusRoute(app: FastifyInstance) {
  app.patch(
    "/tasks/:id/status",
    updateTaskStatusDoc,
    async (request, reply) => {
      try {
        await request.jwtVerify();

        const paramsSchema = z.object({
          id: z.string().uuid("ID da tarefa inválido"),
        });

        const bodySchema = z.object({
          status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"], {
            errorMap: () => ({
              message: "Status deve ser PENDING, IN_PROGRESS ou COMPLETED",
            }),
          }),
        });

        const { id } = paramsSchema.parse(request.params);
        const { status } = bodySchema.parse(request.body);
        const userId = request.user.sub;

        const task = await prisma.task.findFirst({
          where: {
            id,
            ownerId: userId,
          },
        });

        if (!task) {
          return reply.status(404).send({
            message:
              "Tarefa não encontrada ou você não tem permissão para editá-la.",
          });
        }

        await prisma.task.update({
          where: { id },
          data: { status },
        });

        return reply.status(204).send({
          message: "Status da tarefa atualizado com sucesso.",
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply
            .status(400)
            .send({ message: "Erro de validação", errors: error.format() });
        }
        return reply
          .status(500)
          .send({ message: "Erro interno ao atualizar tarefa." });
      }
    },
  );
}
