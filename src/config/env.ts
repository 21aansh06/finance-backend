import dotenv from 'dotenv';
import {StringValue} from "ms"

dotenv.config();

export interface Config {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: StringValue;
  NODE_ENV: string;
}

const requiredEnvs = ['PORT', 'DATABASE_URL', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'NODE_ENV'];

for (const envVar of requiredEnvs) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config: Config = {
  PORT: parseInt(process.env.PORT as string, 10),
  DATABASE_URL: process.env.DATABASE_URL as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN as StringValue,
  NODE_ENV: process.env.NODE_ENV as string,
};
