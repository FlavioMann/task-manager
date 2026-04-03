import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { shareTaskDoc } from "../docs/task-swagger.js";

export async function shareTaskRoute(app: FastifyInstance) {
  app.post("/tasks/:id/share", shareTaskDoc, async (request, reply) => {
    try {
      await request.jwtVerify();

      const paramsSchema = z.object({
        id: z.string().uuid("ID da tarefa inválido"),
      });

      const bodySchema = z.object({
        email: z.string().email("E-mail inválido para convite"),
      });

      const { id } = paramsSchema.parse(request.params);
      const { email } = bodySchema.parse(request.body);
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
            "Tarefa não encontrada ou você não tem permissão para compartilhá-la.",
        });
      }

      const userToShare = await prisma.user.findUnique({
        where: { email },
      });

      if (!userToShare) {
        return reply
          .status(404)
          .send({ message: "Usuário convidado não encontrado." });
      }

      if (userToShare.id === userId) {
        return reply
          .status(400)
          .send({ message: "Você já é o dono desta tarefa." });
      }

      await prisma.task.update({
        where: { id },
        data: {
          collaborators: {
            connect: { id: userToShare.id },
          },
        },
      });

      return reply
        .status(200)
        .send({ message: `Tarefa compartilhada com ${userToShare.name}!` });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply
          .status(400)
          .send({ message: "Erro de validação", errors: error.format() });
      }
      return reply
        .status(500)
        .send({ message: "Erro interno ao compartilhar tarefa." });
    }
  });
}
