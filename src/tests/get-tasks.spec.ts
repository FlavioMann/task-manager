import bcrypt from "bcryptjs";
import {
  expect,
  test,
  describe,
  beforeAll,
  afterAll,
  jest,
} from "@jest/globals";
import request from "supertest";
import { app } from "../server.js";
import { prisma } from "../lib/prisma.js";
import { faker } from "@faker-js/faker";

describe("Get Tasks Route (Integration)", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  test("Deve listar tarefas próprias e tarefas onde sou colaborador", async () => {
    const hashed = await bcrypt.hash("password123", 8);
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashed,
      },
    });
    const token = app.jwt.sign({}, { sub: user.id });

    const otherUser = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashed,
      },
    });

    await prisma.task.create({
      data: { title: "Minha Tarefa Privada", ownerId: user.id },
    });

    await prisma.task.create({
      data: {
        title: "Tarefa Compartilhada Comigo",
        ownerId: otherUser.id,
        collaborators: { connect: { id: user.id } },
      },
    });

    await prisma.task.create({
      data: { title: "Tarefa Secreta do Amigo", ownerId: otherUser.id },
    });

    const response = await request(app.server)
      .get("/tasks")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);

    expect(response.body[0]).toHaveProperty("owner");
    expect(response.body[0]).toHaveProperty("collaborators");
    expect(response.body[0].owner).toHaveProperty("name");
  });

  test("Deve retornar 500 se o token for inválido", async () => {
    const response = await request(app.server)
      .get("/tasks")
      .set("Authorization", `Bearer token-invalido`);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Erro ao carregar lista de tarefas.");
  });

  test("Deve retornar 500 se houver falha no banco de dados", async () => {
    const hashed500 = await bcrypt.hash("password123", 8);
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashed500,
      },
    });
    const token = app.jwt.sign({}, { sub: user.id });

    const prismaSpy = jest
      .spyOn(prisma.task, "findMany")
      .mockRejectedValueOnce(new Error("DB Fail"));

    const response = await request(app.server)
      .get("/tasks")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Erro ao carregar lista de tarefas.");

    prismaSpy.mockRestore();
  });
});
