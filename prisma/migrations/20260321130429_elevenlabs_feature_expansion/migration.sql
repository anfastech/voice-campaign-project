-- CreateEnum
CREATE TYPE "KBDocType" AS ENUM ('TEXT', 'FILE', 'URL');

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "useKnowledgeBase" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Call" ADD COLUMN     "recordingAvailable" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "KnowledgeBaseDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "KBDocType" NOT NULL,
    "content" TEXT,
    "url" TEXT,
    "fileName" TEXT,
    "elevenLabsDocId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBaseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentTool" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentTool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeBaseDocument_userId_idx" ON "KnowledgeBaseDocument"("userId");

-- CreateIndex
CREATE INDEX "AgentTool_agentId_idx" ON "AgentTool"("agentId");

-- AddForeignKey
ALTER TABLE "KnowledgeBaseDocument" ADD CONSTRAINT "KnowledgeBaseDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTool" ADD CONSTRAINT "AgentTool_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
