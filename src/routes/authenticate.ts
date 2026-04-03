import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import z from "zod";
import { FastifyInstance } from "fastify";
import { authenticateDoc } from "../docs/auth-swagger.js";

export async function authenticateRoute(app: FastifyInstance) {
  app.post("/sessions", authenticateDoc, async (request, reply) => {
    try {
      const authenticateBodySchema = z.object({
        email: z.string().email("Formato de e-mail inválido"),
        password: z.string().min(6),
      });

      const { email, password } = authenticateBodySchema.parse(request.body);

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return reply.status(400).send({ message: "Credenciais inválidas." });
      }

      const token = app.jwt.sign(
        {},
        {
          sub: user.id,
          expiresIn: "4d",
        },
      );

      return reply.status(200).send({ token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: "Erro de validação",
        });
      }
      return reply.status(500).send({ message: "Erro interno." });
    }
  });
}
