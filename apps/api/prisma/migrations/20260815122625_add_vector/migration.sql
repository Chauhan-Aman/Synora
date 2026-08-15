-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable
ALTER TABLE "Artifact" ADD COLUMN     "embedding" vector(768);
