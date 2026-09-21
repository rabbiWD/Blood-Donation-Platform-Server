import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import config from "../config/index.js";

const connectionString = process.env.DATABASE_URL || config.database_url;

if (!connectionString) {
	console.error("CRITICAL: DATABASE_URL environment variable is missing!");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
