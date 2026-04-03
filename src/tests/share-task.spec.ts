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

describe("Share Task Route (Integration)", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  test("Deve ser possível compartilhar uma tarefa com outro usuário", async () => {
    const hashedSharedPassword = await bcrypt.hash("password123", 8);
    const owner = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedSharedPassword,
      },
    });
    const guest = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedSharedPassword,
      },
    });

    const token = app.jwt.sign({}, { sub: owner.id });

    const task = await prisma.task.create({
      data: { title: "Tarefa para Compartilhar", ownerId: owner.id },
    });

    const response = await request(app.server)
      .post(`/tasks/${task.id}/share`)
      .set("Authorization", `Bearer ${token}`)
      .send({ email: guest.email });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      `Tarefa compartilhada com ${guest.name}!`,
    );

    const taskWithCollaborators = await prisma.task.findUnique({
      where: { id: task.id },
      include: { collaborators: true },
    });
    expect(taskWithCollaborators?.collaborators).toContainEqual(
      expect.objectContaining({ id: guest.id }),
    );
  });

  test("Deve retornar 404 se a tarefa não existir ou não for do usuário", async () => {
    const hashedSharedPassword = await bcrypt.hash("password123", 8);
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedSharedPassword,
      },
    });
    const token = app.jwt.sign({}, { sub: user.id });
    const fakeId = faker.string.uuid();

    const response = await request(app.server)
      .post(`/tasks/${fakeId}/share`)
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "qualquer@email.com" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe(
      "Tarefa não encontrada ou você não tem permissão para compartilhá-la.",
    );
  });

  test("Deve retornar 404 se o usuário convidado não existir", async () => {
    const hashedSharedPassword = await bcrypt.hash("password123", 8);
    const owner = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedSharedPassword,
      },
    });
    const task = await prisma.task.create({
      data: { title: "Tarefa do Dono", ownerId: owner.id },
    });
    const token = app.jwt.sign({}, { sub: owner.id });

    const response = await request(app.server)
      .post(`/tasks/${task.id}/share`)
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "inexistente@email.com" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Usuário convidado não encontrado.");
  });

  test("Não deve ser possível compartilhar a tarefa consigo mesmo", async () => {
    const hashedSharedPassword = await bcrypt.hash("password123", 8);
    const owner = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedSharedPassword,
      },
    });
    const task = await prisma.task.create({
      data: { title: "Tarefa do Dono", ownerId: owner.id },
    });
    const token = app.jwt.sign({}, { sub: owner.id });

    const response = await request(app.server)
      .post(`/tasks/${task.id}/share`)
      .set("Authorization", `Bearer ${token}`)
      .send({ email: owner.email });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Você já é o dono desta tarefa.");
  });

  test("Deve retornar 500 se o banco de dados falhar no update", async () => {
    const hashedSharedPassword = await bcrypt.hash("password123", 8);
    const owner = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedSharedPassword,
      },
    });
    const guest = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedSharedPassword,
      },
    });
    const task = await prisma.task.create({
      data: { title: "Tarefa Erro 500", ownerId: owner.id },
    });
    const token = app.jwt.sign({}, { sub: owner.id });

    const prismaSpy = jest
      .spyOn(prisma.task, "update")
      .mockRejectedValueOnce(new Error("DB Error"));

    const response = await request(app.server)
      .post(`/tasks/${task.id}/share`)
      .set("Authorization", `Bearer ${token}`)
      .send({ email: guest.email });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Erro interno ao compartilhar tarefa.");

    prismaSpy.mockRestore();
  });
  test("Deve retornar 400 se o ID da tarefa for um UUID inválido", async () => {
    const hashedSharedPassword = await bcrypt.hash("password123", 8);
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedSharedPassword,
      },
    });
    const token = app.jwt.sign({}, { sub: user.id });

    const response = await request(app.server)
      .post("/tasks/id-invalido/share")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "teste@teste.com" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Erro de validação");
    expect(response.body.errors).toBeDefined();
  });

  test("Deve retornar 400 se o e-mail enviado for inválido", async () => {
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
      .post(`/tasks/${task.id}/share`)
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "email-sem-formato" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Erro de validação");
  });
});
