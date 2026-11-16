ALTER TABLE "Environment" ADD COLUMN "dockerfileContent" TEXT;
ALTER TABLE "Environment" DROP COLUMN "description";
