import { z } from "zod";
import bcrypt from "bcryptjs";
import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { createUserDoc } from "../docs/user-swagger.js";

export async function createUserRoute(app: FastifyInstance) {
  app.post("/users", createUserDoc, async (request, reply) => {
    try {
      const createUserSchema = z.object({
        name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres"),
        email: z.string().email("E-mail inválido"),
        password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
      });

      const { name, email, password } = createUserSchema.parse(request.body);

      const userWithSameEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (userWithSameEmail) {
        return reply.status(400).send({ message: "O usuário já existe." });
      }

      const passwordHash = await bcrypt.hash(password, 8);

      const user = await prisma.user.create({
        data: { name, email, password: passwordHash },
      });

      return reply.status(201).send({ userId: user.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: "Erro de validação",
          errors: error.errors.map((err) => ({
            field: err.path[0],
            message: err.message,
          })),
        });
      }
      return reply.status(500).send({ message: "Erro interno no servidor." });
    }
  });
}
