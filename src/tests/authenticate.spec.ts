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
import bcrypt from "bcryptjs";
import { app } from "../server.js";
import { prisma } from "../lib/prisma.js";

describe("Authenticate Route (Integration)", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  test("deve ser possível autenticar", async () => {
    const password = "password123";
    const hashedPassword = await bcrypt.hash(password, 6);

    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedPassword,
      },
    });

    const response = await request(app.server).post("/sessions").send({
      email: user.email,
      password: password,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(typeof response.body.token).toBe("string");
  });

  test("não deve ser possível autenticar com senha incorreta", async () => {
    const email = faker.internet.email();

    await prisma.user.create({
      data: {
        name: "User Test",
        email,
        password: await bcrypt.hash("correct_password", 6),
      },
    });

    const response = await request(app.server).post("/sessions").send({
      email,
      password: "wrong_password",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Credenciais inválidas.");
  });

  test("não deve ser possível autenticar com usuário não existente", async () => {
    const response = await request(app.server).post("/sessions").send({
      email: "non-existent@example.com",
      password: "any_password",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Credenciais inválidas.");
  });

  test("deve retornar 400 ao falhar validação", async () => {
    const response = await request(app.server).post("/sessions").send({
      email: "fake-mail",
      password: "123",
    });

    expect(response.status).toBe(400);
  });

  test("deve retornar 500 em erro interno", async () => {
    const prismaSpy = jest
      .spyOn(prisma.user, "findUnique")
      .mockRejectedValueOnce(new Error("DB Error"));

    const response = await request(app.server).post("/sessions").send({
      email: faker.internet.email(),
      password: "password123",
    });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Erro interno.");

    prismaSpy.mockRestore();
  });
});
