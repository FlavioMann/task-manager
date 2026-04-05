export const createTaskDoc = {
  schema: {
    summary: "",
    description:
      "Cria uma tarefa para o usuário autenticado. É possível vincular a uma categoria existente.",
    tags: ["tasks"],
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["title"],
      properties: {
        title: {
          type: "string",
          minLength: 3,
          description: "Título da tarefa",
        },
        description: {
          type: "string",
          description: "Descrição detalhada (opcional)",
        },
        categoryId: {
          type: "string",
          nullable: true,
          description:
            "ID da categoria (opcional). Aceita UUID, string vazia ou nulo.",
        },
      },
    },
    response: {
      201: {
        description: "Tarefa criada com sucesso",
        type: "object",
        properties: {
          taskId: { type: "string", format: "uuid" },
        },
      },
      400: {
        description: "Erro de validação nos campos enviados",
        type: "object",
        properties: {
          message: { type: "string" },
          errors: { type: "object", additionalProperties: true },
        },
      },
      401: {
        description: "Token ausente ou inválido",
        type: "object",
        properties: {
          message: { type: "string" },
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

export const getTasksDoc = {
  schema: {
    summary: "",
    description:
      "Retorna a lista de tarefas onde o usuário é o proprietário ou um colaborador. Inclui detalhes da categoria, proprietário e nomes dos colaboradores.",
    tags: ["tasks"],
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        description: "Lista de tarefas retornada com sucesso",
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            status: {
              type: "string",
              enum: ["PENDING", "IN_PROGRESS", "COMPLETED"],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            categoryId: { type: "string", format: "uuid", nullable: true },
            ownerId: { type: "string", format: "uuid" },
            category: {
              type: "object",
              nullable: true,
              properties: {
                name: { type: "string" },
              },
            },
            owner: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string", format: "email" },
              },
            },
            collaborators: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                },
              },
            },
          },
        },
      },
      401: {
        description: "Token ausente ou inválido",
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
      500: {
        description: "Erro interno ao carregar a lista",
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
};

export const updateTaskStatusDoc = {
  schema: {
    summary: "",
    description:
      "Altera o status de uma tarefa específica (PENDING, IN_PROGRESS ou COMPLETED). Apenas o dono da tarefa pode alterá-la.",
    tags: ["tasks"],
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      properties: {
        id: {
          type: "string",
          format: "uuid",
          description: "ID da tarefa a ser atualizada",
        },
      },
    },
    body: {
      type: "object",
      required: ["status"],
      properties: {
        status: {
          type: "string",
          enum: ["PENDING", "IN_PROGRESS", "COMPLETED"],
          description: "Novo status da tarefa",
        },
      },
    },
    response: {
      204: {
        description: "Status atualizado com sucesso",
        type: "null",
      },
      400: {
        description: "ID inválido ou status incorreto",
        type: "object",
        properties: {
          message: { type: "string" },
          errors: { type: "object", additionalProperties: true },
        },
      },
      404: {
        description: "Tarefa não encontrada ou sem permissão",
        type: "object",
        properties: {
          message: { type: "string" },
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

export const deleteTaskDoc = {
  schema: {
    summary: "",
    description:
      "Remove permanentemente uma tarefa. Apenas o dono da tarefa pode excluí-la.",
    tags: ["tasks"],
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      properties: {
        id: {
          type: "string",
          format: "uuid",
          description: "ID da tarefa a ser excluída",
        },
      },
    },
    response: {
      204: {
        description: "Tarefa excluída com sucesso",
        type: "null",
      },
      400: {
        description: "ID inválido",
        type: "object",
        properties: {
          message: { type: "string" },
          errors: { type: "object", additionalProperties: true },
        },
      },
      401: {
        description: "Token ausente ou inválido",
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
      404: {
        description: "Tarefa não encontrada ou sem permissão",
        type: "object",
        properties: {
          message: { type: "string" },
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

export const shareTaskDoc = {
  schema: {
    summary: "",
    description:
      "Compartilha uma tarefa com outro usuário, adicionando-o como colaborador. Apenas o dono da tarefa pode compartilhá-la.",
    tags: ["tasks"],
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      properties: {
        id: {
          type: "string",
          format: "uuid",
          description: "ID da tarefa a ser compartilhada",
        },
      },
    },
    body: {
      type: "object",
      required: ["email"],
      properties: {
        email: {
          type: "string",
          format: "email",
          description: "E-mail do usuário para quem compartilhar a tarefa",
        },
      },
    },
    response: {
      200: {
        description: "Tarefa compartilhada com sucesso",
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
      400: {
        description:
          "Erro de validação ou tentativa de compartilhar consigo mesmo",
        type: "object",
        properties: {
          message: { type: "string" },
          errors: { type: "object", additionalProperties: true },
        },
      },
      401: {
        description: "Token ausente ou inválido",
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
      404: {
        description:
          "Tarefa não encontrada, sem permissão ou usuário não encontrado",
        type: "object",
        properties: {
          message: { type: "string" },
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
