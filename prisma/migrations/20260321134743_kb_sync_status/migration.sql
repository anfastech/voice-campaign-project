-- AlterTable
ALTER TABLE "KnowledgeBaseDocument" ADD COLUMN     "syncError" TEXT,
ADD COLUMN     "syncStatus" TEXT NOT NULL DEFAULT 'PENDING';
