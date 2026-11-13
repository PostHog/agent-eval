PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "filePath" TEXT,
    "content" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_Skill" ("id", "title", "filePath", "createdAt", "updatedAt")
SELECT "id", "title", "directory" || '/SKILL.md', "createdAt", "updatedAt"
FROM "Skill";

DROP TABLE "Skill";
ALTER TABLE "new_Skill" RENAME TO "Skill";

PRAGMA foreign_keys=ON;
