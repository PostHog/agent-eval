CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionConcurrency" INTEGER NOT NULL DEFAULT 2,
    "updatedAt" DATETIME NOT NULL
);
