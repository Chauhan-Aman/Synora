import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Updating existing chunks with tsvector...");
  await prisma.$executeRawUnsafe(`UPDATE "Chunk" SET "searchVector" = to_tsvector('english', text) WHERE "searchVector" IS NULL;`);
  console.log("Creating GIN index on searchVector...");
  try {
    await prisma.$executeRawUnsafe(`CREATE INDEX chunk_search_idx ON "Chunk" USING GIN("searchVector");`);
    console.log("Index created successfully.");
  } catch (e: any) {
    if (e.message.includes("already exists")) {
      console.log("Index already exists, skipping.");
    } else {
      console.error("Error creating index:", e.message);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
