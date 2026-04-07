import { expect, test, describe, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { app } from "../server.js";
import { prisma } from "../lib/prisma.js";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

describe("Update Category Route (Integration)", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  test("Deve ser possível atualizar o nome de uma categoria", async () => {
    const hashedPassword = await bcrypt.hash("password123", 8);
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedPassword,
      },
    });

    const category = await prisma.category.create({
      data: { name: "Nome Antigo", ownerId: user.id },
    });

    const token = app.jwt.sign({}, { sub: user.id });

    const response = await request(app.server)
      .patch(`/categories/${category.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Nome Novo" });

    expect(response.status).toBe(200);
    expect(response.body.category.name).toBe("Nome Novo");
  });

  test("Deve retornar 401 se não houver token de autenticação", async () => {
    const fakeId = faker.string.uuid();

    const response = await request(app.server)
      .patch(`/categories/${fakeId}`)
      .send({ name: "Sem Token" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Não autorizado. Faça login novamente.");
  });

  test("Deve retornar 404 se a categoria não existir", async () => {
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
      .patch(`/categories/${fakeId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Novo Nome" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Categoria não encontrada.");
  });

  test("Não deve atualizar categoria de outro usuário", async () => {
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

    const category = await prisma.category.create({
      data: { name: "Categoria do Dono", ownerId: owner.id },
    });

    const tokenOtherUser = app.jwt.sign({}, { sub: otherUser.id });

    const response = await request(app.server)
      .patch(`/categories/${category.id}`)
      .set("Authorization", `Bearer ${tokenOtherUser}`)
      .send({ name: "Invadido" });

    expect(response.status).toBe(404);
  });

  test("Deve retornar 400 se o nome for muito curto", async () => {
    const hashedPassword = await bcrypt.hash("password123", 8);
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedPassword,
      },
    });

    const category = await prisma.category.create({
      data: { name: "Categoria Válida", ownerId: user.id },
    });

    const token = app.jwt.sign({}, { sub: user.id });

    const response = await request(app.server)
      .patch(`/categories/${category.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "A" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "body/name must NOT have fewer than 2 characters",
    );
  });

  test("Deve retornar 400 se o ID for inválido", async () => {
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
      .patch("/categories/id-invalido")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Nome Válido" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'params/id must match format "uuid"',
    );
  });
});
