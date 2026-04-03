import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { createTaskDoc } from "../docs/task-swagger.js";

export async function createTaskRoute(app: FastifyInstance) {
  app.post("/tasks", createTaskDoc, async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply
        .status(401)
        .send({ message: "Não autorizado. Faça login novamente." });
    }

    const createTaskSchema = z.object({
      title: z.string().min(3, "O título deve ter no mínimo 3 caracteres"),
      description: z.string().optional(),
      categoryId: z.string().uuid().optional().or(z.literal("")),
    });

    try {
      const { title, description, categoryId } = createTaskSchema.parse(
        request.body,
      );

      const userId = request.user.sub;

      const task = await prisma.task.create({
        data: {
          title,
          description,
          ownerId: userId,
          categoryId: categoryId && categoryId !== "" ? categoryId : null,
        },
      });

      return reply.status(201).send({ taskId: task.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply
          .status(400)
          .send({ message: "Erro de validação", errors: error.format() });
      }
      return reply.status(500).send({ message: "Erro ao criar tarefa." });
    }
  });
}
