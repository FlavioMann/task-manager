export const getUserDoc = {
  schema: {
    summary: "",
    description:
      "Retorna os dados do usuário autenticado com base no token JWT.",
    tags: ["users"],
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        description: "Dados do usuário autenticado",
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              email: { type: "string", format: "email" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
      401: {
        description: "Não autorizado (Token ausente ou inválido)",
        type: "object",
        properties: { message: { type: "string" } },
      },
      404: {
        description: "Usuário não encontrado",
        type: "object",
        properties: { message: { type: "string" } },
      },
    },
  },
};

export const createUserDoc = {
  schema: {
    summary: "",
    description: "Essa rota registra um novo usuário no banco de dados.",
    tags: ["users"],
    body: {
      type: "object",
      required: ["name", "email", "password"],
      properties: {
        name: {
          type: "string",
          minLength: 3,
          description: "Nome completo do usuário",
        },
        email: {
          type: "string",
          format: "email",
          description: "E-mail único para cadastro",
        },
        password: {
          type: "string",
          minLength: 6,
          description: "Senha de acesso",
        },
      },
    },
    response: {
      201: {
        description: "Usuário criado com sucesso",
        type: "object",
        properties: {
          userId: { type: "string", format: "uuid" },
        },
      },
      400: {
        description: "Erro de validação ou e-mail duplicado",
        type: "object",
        properties: {
          message: { type: "string" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
      500: {
        description: "Erro interno no servidor",
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
};
