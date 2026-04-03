/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1", // Isso resolve o problema de usar .js nos imports do TS
  },
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.spec.ts", // Não testar os próprios arquivos de teste
    "!src/server.ts", // Geralmente ignoramos o arquivo que liga o servidor
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  transform: {
    // Garante que arquivos .ts sejam processados pelo ts-jest com suporte a ESM
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
};
