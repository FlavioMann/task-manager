import { expect, test, describe, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { app } from "../server.js";
import { prisma } from "../lib/prisma.js";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

describe("Get Categories Route (Integration)", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  test("Deve retornar todas as categorias do usuário autenticado", async () => {
    const hashedPassword = await bcrypt.hash("password123", 8);
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedPassword,
      },
    });

    await prisma.category.createMany({
      data: [
        { name: faker.commerce.department(), ownerId: user.id },
        { name: faker.commerce.department() + "_2", ownerId: user.id },
      ],
    });

    const token = app.jwt.sign({}, { sub: user.id });

    const response = await request(app.server)
      .get("/categories")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.categories).toBeDefined();
    expect(response.body.categories.length).toBeGreaterThanOrEqual(2);
  });

  test("Deve retornar lista vazia se o usuário não tiver categorias", async () => {
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
      .get("/categories")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.categories).toEqual([]);
  });

  test("Deve retornar 401 se não houver token de autenticação", async () => {
    const response = await request(app.server).get("/categories");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Não autorizado. Faça login novamente.");
  });

  test("Não deve retornar categorias de outro usuário", async () => {
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

    await prisma.category.create({
      data: { name: "Categoria do Dono", ownerId: owner.id },
    });

    const tokenOtherUser = app.jwt.sign({}, { sub: otherUser.id });

    const response = await request(app.server)
      .get("/categories")
      .set("Authorization", `Bearer ${tokenOtherUser}`);

    expect(response.status).toBe(200);
    const names = response.body.categories.map((c: { name: string }) => c.name);
    expect(names).not.toContain("Categoria do Dono");
  });
});
