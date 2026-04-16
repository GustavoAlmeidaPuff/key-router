import { config } from "dotenv";
import { execSync } from "node:child_process";
import { prisma } from "../lib/prisma";
import { generateProxyKey } from "../lib/proxyAuth";

config();

function validateEnv() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada.");
  }
}

async function main() {
  validateEnv();
  execSync("npx prisma migrate dev --name init", { stdio: "inherit" });
  execSync("npx prisma generate", { stdio: "inherit" });

  const initialProxyKey = generateProxyKey();
  await prisma.proxyKey.create({
    data: { name: "Initial Proxy Key", key: initialProxyKey },
  });

  console.log("\nProxy key inicial criada:");
  console.log(initialProxyKey);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
