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

describe("Create Task Route (Integration)", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  test("Deve ser possível criar uma tarefa com dados aleatórios", async () => {
    const hashedSharedPassword = await bcrypt.hash("password123", 8);
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedSharedPassword,
      },
    });
    const token = app.jwt.sign({}, { sub: user.id });
    const taskData = {
      title: faker.lorem.words(3),
      description: faker.lorem.paragraph(),
    };

    const response = await request(app.server)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send(taskData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("taskId");

    const taskInDb = await prisma.task.findUnique({
      where: { id: response.body.taskId },
    });
    expect(taskInDb?.title).toBe(taskData.title);
    expect(taskInDb?.description).toBe(taskData.description);
  });

  test("Deve ser possível criar tarefa vinculada a uma categoria dinâmica", async () => {
    const hashedSharedPassword = await bcrypt.hash("password123", 8);
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedSharedPassword,
      },
    });
    const token = app.jwt.sign({}, { sub: user.id });

    const category = await prisma.category.create({
      data: {
        name: faker.commerce.department(),
        ownerId: user.id,
      },
    });

    const response = await request(app.server)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: faker.lorem.sentence(3),
        categoryId: category.id,
      });

    expect(response.status).toBe(201);

    const taskInDb = await prisma.task.findUnique({
      where: { id: response.body.taskId },
    });
    expect(taskInDb?.categoryId).toBe(category.id);
  });

  test("Deve falhar ao enviar título muito curto", async () => {
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
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Ab",
      });

    expect(response.status).toBe(400);
  });

  test("Não deve ser possível criar tarefa sem um token válido (401)", async () => {
    const response = await request(app.server)
      .post("/tasks")
      .send({
        title: faker.lorem.sentence(3),
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Não autorizado. Faça login novamente.");
  });

  test("Deve retornar 500 se ocorrer um erro inesperado no banco de dados", async () => {
    const hashedSharedPassword = await bcrypt.hash("password123", 8);
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedSharedPassword,
      },
    });
    const token = app.jwt.sign({}, { sub: user.id });

    const prismaSpy = jest
      .spyOn(prisma.task, "create")
      .mockRejectedValueOnce(new Error("Falha no banco"));

    const response = await request(app.server)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: faker.lorem.sentence(3),
      });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Erro ao criar tarefa.");

    prismaSpy.mockRestore();
  });
});
