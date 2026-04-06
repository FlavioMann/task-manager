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

describe("Get Metrics Route (Integration)", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  test("Deve calcular as métricas corretamente para o usuário", async () => {
    const hashed = await bcrypt.hash("password123", 8);
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashed,
      },
    });
    const token = app.jwt.sign({}, { sub: user.id });

    await prisma.task.createMany({
      data: [
        {
          title: faker.lorem.sentence(2),
          status: "COMPLETED",
          ownerId: user.id,
        },
        {
          title: faker.lorem.sentence(2),
          status: "COMPLETED",
          ownerId: user.id,
        },
        {
          title: faker.lorem.sentence(2),
          status: "IN_PROGRESS",
          ownerId: user.id,
        },
      ],
    });

    const otherUser = await prisma.user.create({
      data: { name: "Outro", email: faker.internet.email(), password: hashed },
    });
    await prisma.task.create({
      data: { title: "Ignorar", ownerId: otherUser.id },
    });

    const response = await request(app.server)
      .get("/metrics")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      totalTasks: 3,
      completedTasks: 2,
      pendingTasks: 0,
      inProgressTasks: 1,
      progressPercentage: "67%",
      tasksByCategory: expect.any(Array),
    });
  });

  test("Deve retornar 0% de progresso se o usuário não tiver tarefas", async () => {
    const hashed = await bcrypt.hash("password123", 8);
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashed,
      },
    });
    const token = app.jwt.sign({}, { sub: user.id });

    const response = await request(app.server)
      .get("/metrics")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.progressPercentage).toBe("0%");
    expect(response.body.totalTasks).toBe(0);
    expect(response.body.inProgressTasks).toBe(0);
  });

  test("Deve retornar 500 se o token for inválido (conforme código atual)", async () => {
    const response = await request(app.server)
      .get("/metrics")
      .set("Authorization", `Bearer token-falso`);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Erro ao gerar relatório de progresso.");
  });

  test("Deve retornar 500 se o banco de dados falhar", async () => {
    const hashed = await bcrypt.hash("password123", 8);
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashed,
      },
    });
    const token = app.jwt.sign({}, { sub: user.id });

    const prismaSpy = jest
      .spyOn(prisma.task, "count")
      .mockRejectedValueOnce(new Error("Falha"));

    const response = await request(app.server)
      .get("/metrics")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Erro ao gerar relatório de progresso.");

    prismaSpy.mockRestore();
  });
});
