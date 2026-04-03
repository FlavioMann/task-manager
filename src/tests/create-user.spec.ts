import {
  expect,
  describe,
  beforeAll,
  afterAll,
  jest,
  test,
} from "@jest/globals";
import request from "supertest";

import { faker } from "@faker-js/faker";
import { app } from "../server.js";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";

describe("User Routes (Integration)", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  test("deve ser possível criar um novo usuário", async () => {
    const userData = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: "password123",
    };

    const response = await request(app.server).post("/users").send(userData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("userId");

    const userInDb = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    expect(userInDb).toBeTruthy();
    expect(userInDb?.password).not.toBe("password123");
  });

  test("não deve ser possível criar um usuário com um email existente", async () => {
    const email = faker.internet.email();
    const password = "password123";

    const hashed = await bcrypt.hash(password, 8);

    await prisma.user.create({
      data: {
        name: "Usuário Original",
        email: email,
        password: hashed,
      },
    });

    const response = await request(app.server).post("/users").send({
      name: "Usuário Impostor",
      email: email,
      password: password,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("O usuário já existe.");
  });

  test("deve retornar erro se a validação falhar", async () => {
    const response = await request(app.server).post("/users").send({
      name: "User Test",
      email: "email-invalido",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/email|password|required|body/i);
  });

  test("deve retornar 500 se um erro inesperado ocorrer", async () => {
    const prismaSpy = jest
      .spyOn(prisma.user, "create")
      .mockRejectedValueOnce(new Error("Database connection failed"));

    const response = await request(app.server).post("/users").send({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: "password123", // Senha pura para a API
    });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Erro interno no servidor.");

    prismaSpy.mockRestore();
  });
});
