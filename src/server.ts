import fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import process from "node:process";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

import { createUserRoute } from "./routes/create-user.js";
import { getUserRoute } from "./routes/get-user.js";
import { authenticateRoute } from "./routes/authenticate.js";
import { createTaskRoute } from "./routes/create-task.js";
import { createCategoryRoute } from "./routes/create-category.js";
import { getCategoriesRoute } from "./routes/get-categories.js";
import { getCategoryByIdRoute } from "./routes/get-category-by-id.js";
import { updateCategoryRoute } from "./routes/update-category.js";
import { deleteCategoryRoute } from "./routes/delete-category.js";
import { getMetricsRoute } from "./routes/get-metrics.js";
import { updateTaskStatusRoute } from "./routes/update-task-status.js";
import { shareTaskRoute } from "./routes/share-task.js";
import { getTasksRoute } from "./routes/get-tasks.js";
import { deleteTaskRoute } from "./routes/delete-task.js";

export const app = fastify();

app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

app.register(jwt, {
  secret: process.env.JWT_SECRET || "default_secret_key",
});

app.register(swagger, {
  openapi: {
    info: {
      title: "Task Manager API",
      description:
        "API para gerenciamento de tarefas e colaboração entre usuários",
      version: "1.0.0",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
});

app.register(swaggerUi, {
  routePrefix: "/docs",
});

app.register(createUserRoute);
app.register(getUserRoute);
app.register(authenticateRoute);
app.register(createTaskRoute);
app.register(createCategoryRoute);
app.register(getCategoriesRoute);
app.register(getCategoryByIdRoute);
app.register(updateCategoryRoute);
app.register(deleteCategoryRoute);
app.register(getMetricsRoute);
app.register(updateTaskStatusRoute);
app.register(shareTaskRoute);
app.register(getTasksRoute);
app.register(deleteTaskRoute);

const isTestEnv = process.env.NODE_ENV === "test";
const isLambdaEnv = !!(
  process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV
);

if (!isTestEnv && !isLambdaEnv) {
  app
    .listen({
      port: Number(process.env.PORT) || 3333,
      host: "0.0.0.0",
    })
    .then(() => {
      console.log("🚀 Server is running local on http://localhost:3333");
    })
    .catch((err) => {
      console.error("Erro ao iniciar o servidor:", err);
      process.exit(1);
    });
}
