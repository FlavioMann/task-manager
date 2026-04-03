export const createCategoryDoc = {
  schema: {
    summary: "",
    description:
      "Cria uma categoria vinculada ao usuário autenticado para organizar as tarefas.",
    tags: ["category"],
    security: [{ bearerAuth: [] }], // Ativa a autenticação via JWT no Swagger
    body: {
      type: "object",
      required: ["name"],
      properties: {
        name: {
          type: "string",
          minLength: 2,
          description: "Nome da categoria (Ex: Trabalho, Estudos, Pessoal)",
        },
      },
    },
    response: {
      201: {
        description: "Categoria criada com sucesso",
        type: "object",
        properties: {
          categoryId: { type: "string", format: "uuid" },
        },
      },
      400: {
        description: "Erro de validação ou categoria duplicada",
        type: "object",
        properties: {
          message: { type: "string" },
          errors: { type: "object", additionalProperties: true },
        },
      },
      401: {
        description: "Não autorizado (Token ausente ou inválido)",
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
};
