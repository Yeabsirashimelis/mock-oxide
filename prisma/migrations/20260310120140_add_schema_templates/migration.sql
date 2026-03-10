-- CreateTable
CREATE TABLE "SchemaTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schema" JSONB NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchemaTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SchemaTemplate_userId_idx" ON "SchemaTemplate"("userId");

-- AddForeignKey
ALTER TABLE "SchemaTemplate" ADD CONSTRAINT "SchemaTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
