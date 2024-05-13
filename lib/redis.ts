import { Redis } from "ioredis";
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const redis = new Redis(
  process.env.REDIS_URL ?? "redis://localhost:6379",
);

export default redis;