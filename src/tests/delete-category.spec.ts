import { expect, test, describe, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { app } from "../server.js";
import { prisma } from "../lib/prisma.js";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

describe("Delete Category Route (Integration)", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  test("Deve ser possível deletar uma categoria", async () => {
    const hashedPassword = await bcrypt.hash("password123", 8);
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedPassword,
      },
    });

    const category = await prisma.category.create({
      data: { name: faker.commerce.department(), ownerId: user.id },
    });

    const token = app.jwt.sign({}, { sub: user.id });

    const response = await request(app.server)
      .delete(`/categories/${category.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(204);

    const deleted = await prisma.category.findUnique({
      where: { id: category.id },
    });
    expect(deleted).toBeNull();
  });

  test("Deve retornar 401 se não houver token de autenticação", async () => {
    const fakeId = faker.string.uuid();

    const response = await request(app.server).delete(`/categories/${fakeId}`);

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
      .delete(`/categories/${fakeId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Categoria não encontrada.");
  });

  test("Não deve ser possível deletar categoria de outro usuário", async () => {
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
      .delete(`/categories/${category.id}`)
      .set("Authorization", `Bearer ${tokenOtherUser}`);

    expect(response.status).toBe(404);
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
      .delete("/categories/id-invalido")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'params/id must match format "uuid"',
    );
  });
});
