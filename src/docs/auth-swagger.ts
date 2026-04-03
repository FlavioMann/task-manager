export const authenticateDoc = {
  schema: {
    summary: "",
    description:
      "Valida as credenciais e retorna um token JWT para acesso às rotas protegidas.",
    tags: ["authenticate"],
    body: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: {
          type: "string",
          format: "email",
          description: "E-mail do usuário cadastrado",
        },
        password: {
          type: "string",
          minLength: 6,
          description: "Senha de acesso",
        },
      },
    },
    response: {
      200: {
        description: "Autenticação realizada com sucesso",
        type: "object",
        properties: {
          token: {
            type: "string",
            description: "Token JWT para ser usado no Header Authorization",
          },
        },
      },
      400: {
        description: "Credenciais inválidas ou erro de validação",
        type: "object",
        properties: {
          message: { type: "string" },
          errors: { type: "object", additionalProperties: true },
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
