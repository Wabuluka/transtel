import Redis from "ioredis";
import { ENV } from "./env.js";

export const redis = new Redis(ENV.REDIS_URL);
