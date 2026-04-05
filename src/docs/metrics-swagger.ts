export const getMetricsDoc = {
  schema: {
    summary: "",
    description:
      "Retorna um resumo estatístico das tarefas do usuário, incluindo total, concluídas, pendentes, em progresso e progresso percentual.",
    tags: ["metrics"],
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        description: "Métricas geradas com sucesso",
        type: "object",
        properties: {
          totalTasks: {
            type: "integer",
            description: "Quantidade total de tarefas",
          },
          completedTasks: {
            type: "integer",
            description: "Quantidade de tarefas concluídas",
          },
          pendingTasks: {
            type: "integer",
            description: "Quantidade de tarefas pendentes",
          },
          inProgressTasks: {
            type: "integer",
            description: "Quantidade de tarefas em andamento",
          },
          progressPercentage: {
            type: "string",
            example: "75%",
            description: "Percentual de conclusão formatado",
          },
          tasksByCategory: {
            type: "array",
            description: "Contagem de tarefas agrupadas por ID de categoria",
            items: {
              type: "object",
              properties: {
                categoryId: { type: "string", format: "uuid", nullable: true },
                _count: {
                  type: "object",
                  properties: {
                    id: { type: "integer" },
                  },
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
        description: "Erro interno ao gerar o relatório",
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
};
