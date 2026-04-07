import { expect, test, describe, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { app } from "../server.js";
import { prisma } from "../lib/prisma.js";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

describe("Get User Route (Integration)", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  test("Deve retornar os dados do usuário autenticado", async () => {
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
      .get("/users")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(user.id);
    expect(response.body.user.name).toBe(user.name);
    expect(response.body.user.email).toBe(user.email);
    expect(response.body.user.createdAt).toBeDefined();
    expect(response.body.user.password).toBeUndefined();
  });

  test("Deve retornar 401 se não houver token de autenticação", async () => {
    const response = await request(app.server).get("/users");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Não autorizado. Faça login novamente.");
  });

  test("Deve retornar 404 se o usuário do token não existir no banco", async () => {
    const fakeId = faker.string.uuid();
    const token = app.jwt.sign({}, { sub: fakeId });

    const response = await request(app.server)
      .get("/users")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Usuário não encontrado.");
  });
});
