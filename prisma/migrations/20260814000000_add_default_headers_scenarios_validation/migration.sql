-- Add columns that were introduced in the schema but never captured in a migration.
-- Without these, a fresh `prisma migrate deploy` produces a database that is missing
-- Project.defaultHeaders, Endpoint.scenarios and Endpoint.validateRequest, which
-- crashes the dashboard on first load.

-- AlterTable
ALTER TABLE "Endpoint" ADD COLUMN     "scenarios" JSONB,
ADD COLUMN     "validateRequest" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "defaultHeaders" JSONB;
