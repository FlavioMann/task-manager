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
import bcrypt from "bcryptjs";

describe("Update Task Status Route (Integration)", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  test("Deve ser possível atualizar o status de uma tarefa para COMPLETED", async () => {
    const hashedSharedPassword = await bcrypt.hash("password123", 8);
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedSharedPassword,
      },
    });
    const token = app.jwt.sign({}, { sub: user.id });

    const task = await prisma.task.create({
      data: {
        title: faker.lorem.sentence(3),
        status: "PENDING",
        ownerId: user.id,
      },
    });

    const response = await request(app.server)
      .patch(`/tasks/${task.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "COMPLETED" });

    expect(response.status).toBe(204);

    const updatedTask = await prisma.task.findUnique({
      where: { id: task.id },
    });
    expect(updatedTask?.status).toBe("COMPLETED");
  });

  test("Deve retornar 404 ao tentar atualizar tarefa de outro usuário", async () => {
    const hashedSharedPassword = await bcrypt.hash("password123", 8);
    const userA = await prisma.user.create({
      data: {
        name: "User A",
        email: faker.internet.email(),
        password: hashedSharedPassword,
      },
    });
    const userB = await prisma.user.create({
      data: {
        name: "User B",
        email: faker.internet.email(),
        password: hashedSharedPassword,
      },
    });

    const taskOfA = await prisma.task.create({
      data: { title: "Tarefa do A", ownerId: userA.id },
    });

    const tokenB = app.jwt.sign({}, { sub: userB.id });

    const response = await request(app.server)
      .patch(`/tasks/${taskOfA.id}/status`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ status: "IN_PROGRESS" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe(
      "Tarefa não encontrada ou você não tem permissão para editá-la.",
    );
  });

  test("Deve retornar 400 para status inválido (Zod)", async () => {
    const hashedSharedPassword = await bcrypt.hash("password123", 8);
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedSharedPassword,
      },
    });
    const task = await prisma.task.create({
      data: { title: "Tarefa Teste", ownerId: user.id },
    });
    const token = app.jwt.sign({}, { sub: user.id });

    const response = await request(app.server)
      .patch(`/tasks/${task.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "STATUS_INVENTADO" });

    expect(response.status).toBe(400);
  });

  test("Deve retornar 500 se o banco de dados falhar no update", async () => {
    const hashedSharedPassword = await bcrypt.hash("password123", 8);
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedSharedPassword,
      },
    });
    const task = await prisma.task.create({
      data: { title: "Tarefa Erro 500", ownerId: user.id },
    });
    const token = app.jwt.sign({}, { sub: user.id });

    const prismaSpy = jest
      .spyOn(prisma.task, "update")
      .mockRejectedValueOnce(new Error("DB Error"));

    const response = await request(app.server)
      .patch(`/tasks/${task.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "COMPLETED" });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Erro interno ao atualizar tarefa.");

    prismaSpy.mockRestore();
  });
});
