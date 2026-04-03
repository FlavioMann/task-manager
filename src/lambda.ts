import awsLambdaFastify from "@fastify/aws-lambda";
import { app } from "./server.js";

export const handler = awsLambdaFastify(app);
