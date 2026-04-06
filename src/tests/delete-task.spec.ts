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

describe("Delete Task Route (Integration)", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  test("Deve ser possível deletar uma tarefa", async () => {
    const hashedPassword = await bcrypt.hash("password123", 8);
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedPassword,
      },
    });
    const task = await prisma.task.create({
      data: { title: "Tarefa para Deletar", ownerId: user.id },
    });
    const token = app.jwt.sign({}, { sub: user.id });

    const response = await request(app.server)
      .delete(`/tasks/${task.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(204);

    const deletedTask = await prisma.task.findUnique({
      where: { id: task.id },
    });
    expect(deletedTask).toBeNull();
  });

  test("Deve retornar 401 se não houver token de autenticação", async () => {
    const fakeId = faker.string.uuid();

    const response = await request(app.server).delete(`/tasks/${fakeId}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Não autorizado. Faça login novamente.");
  });

  test("Deve retornar 404 se a tarefa não existir", async () => {
    const hashedPassword = await bcrypt.hash("password123", 8);
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedPassword,
      },
    });
    const token = app.jwt.sign({}, { sub: user.id });
    const fakeId = faker.string.uuid();

    const response = await request(app.server)
      .delete(`/tasks/${fakeId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe(
      "Tarefa não encontrada ou você não tem permissão para excluí-la.",
    );
  });

  test("Não deve ser possível deletar uma tarefa de outro usuário", async () => {
    const hashedPassword = await bcrypt.hash("password123", 8);
    const owner = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedPassword,
      },
    });
    const otherUser = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedPassword,
      },
    });
    const task = await prisma.task.create({
      data: { title: "Tarefa do Dono", ownerId: owner.id },
    });
    const tokenOtherUser = app.jwt.sign({}, { sub: otherUser.id });

    const response = await request(app.server)
      .delete(`/tasks/${task.id}`)
      .set("Authorization", `Bearer ${tokenOtherUser}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe(
      "Tarefa não encontrada ou você não tem permissão para excluí-la.",
    );
  });

  test("Deve retornar 400 se o ID da tarefa for um UUID inválido", async () => {
    const hashedPassword = await bcrypt.hash("password123", 8);
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedPassword,
      },
    });
    const token = app.jwt.sign({}, { sub: user.id });

    const response = await request(app.server)
      .delete("/tasks/id-invalido")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Erro de validação");
    expect(response.body.errors).toBeDefined();
  });

  test("Deve retornar 500 se o banco de dados falhar", async () => {
    const hashedPassword = await bcrypt.hash("password123", 8);
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedPassword,
      },
    });
    const task = await prisma.task.create({
      data: { title: "Tarefa Erro 500", ownerId: user.id },
    });
    const token = app.jwt.sign({}, { sub: user.id });

    const prismaSpy = jest
      .spyOn(prisma.task, "delete")
      .mockRejectedValueOnce(new Error("DB Error"));

    const response = await request(app.server)
      .delete(`/tasks/${task.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Erro interno ao excluir tarefa.");

    prismaSpy.mockRestore();
  });
});
