import { expect, test, describe, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { app } from "../server.js";
import { prisma } from "../lib/prisma.js";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

describe("Create Category Route (Integration)", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  test("Deve ser possível criar uma nova categoria", async () => {
    const hashedSharedPassword = await bcrypt.hash("password123", 8);
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedSharedPassword,
      },
    });

    const token = app.jwt.sign({}, { sub: user.id });
    const categoryName = faker.commerce.department();

    const response = await request(app.server)
      .post("/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: categoryName });

    expect(response.status).toBe(201);
  });

  test("Não deve criar categoria sem token de autenticação", async () => {
    const response = await request(app.server)
      .post("/categories")
      .send({ name: "Sem Token" });

    expect(response.status).toBe(400);
  });

  test("Deve retornar erro se o nome for muito curto", async () => {
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
      .post("/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "A" });

    expect(response.status).toBe(400);
  });
});
