ALTER TABLE "Environment" ADD COLUMN "repositoryUrl" TEXT;
ALTER TABLE "Environment" ADD COLUMN "executionMode" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "Environment" ADD COLUMN "dockerfilePath" TEXT;
