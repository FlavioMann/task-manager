const categoryProperties = {
  id: { type: "string", format: "uuid" },
  name: { type: "string" },
};

const notFoundResponse = {
  description: "Categoria não encontrada",
  type: "object",
  properties: { message: { type: "string" } },
};

const unauthorizedResponse = {
  description: "Não autorizado (Token ausente ou inválido)",
  type: "object",
  properties: { message: { type: "string" } },
};

const badRequestResponse = {
  description: "Erro de validação ou ID inválido",
  type: "object",
  properties: {
    message: { type: "string" },
    errors: { type: "object", additionalProperties: true },
  },
};

export const getCategoriesDoc = {
  schema: {
    summary: "",
    description: "Retorna todas as categorias do usuário autenticado.",
    tags: ["category"],
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        description: "Lista de categorias",
        type: "object",
        properties: {
          categories: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ...categoryProperties,
                _count: {
                  type: "object",
                  properties: { tasks: { type: "number" } },
                },
              },
            },
          },
        },
      },
      401: unauthorizedResponse,
    },
  },
};

export const getCategoryByIdDoc = {
  schema: {
    summary: "",
    description:
      "Retorna uma categoria específica do usuário autenticado junto com suas tarefas.",
    tags: ["category"],
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      properties: { id: { type: "string", format: "uuid" } },
      required: ["id"],
    },
    response: {
      200: {
        description: "Categoria encontrada",
        type: "object",
        properties: {
          category: {
            type: "object",
            properties: {
              ...categoryProperties,
              tasks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    title: { type: "string" },
                    status: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      400: badRequestResponse,
      401: unauthorizedResponse,
      404: notFoundResponse,
    },
  },
};

export const updateCategoryDoc = {
  schema: {
    summary: "",
    description: "Atualiza o nome de uma categoria do usuário autenticado.",
    tags: ["category"],
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      properties: { id: { type: "string", format: "uuid" } },
      required: ["id"],
    },
    body: {
      type: "object",
      required: ["name"],
      properties: {
        name: {
          type: "string",
          minLength: 2,
          description: "Novo nome da categoria",
        },
      },
    },
    response: {
      200: {
        description: "Categoria atualizada com sucesso",
        type: "object",
        properties: {
          category: {
            type: "object",
            properties: categoryProperties,
          },
        },
      },
      400: badRequestResponse,
      401: unauthorizedResponse,
      404: notFoundResponse,
    },
  },
};

export const deleteCategoryDoc = {
  schema: {
    summary: "",
    description:
      "Remove uma categoria do usuário autenticado. As tarefas vinculadas perdem a referência à categoria.",
    tags: ["category"],
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      properties: { id: { type: "string", format: "uuid" } },
      required: ["id"],
    },
    response: {
      204: {
        description: "Categoria removida com sucesso",
        type: "null",
      },
      400: badRequestResponse,
      401: unauthorizedResponse,
      404: notFoundResponse,
    },
  },
};

export const createCategoryDoc = {
  schema: {
    summary: "",
    description:
      "Cria uma categoria vinculada ao usuário autenticado para organizar as tarefas.",
    tags: ["category"],
    security: [{ bearerAuth: [] }],
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
