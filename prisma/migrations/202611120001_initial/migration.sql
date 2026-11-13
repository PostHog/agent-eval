-- CreateTable
CREATE TABLE "Eval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "environmentId" TEXT,
    "personaId" TEXT,
    "judge" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Eval_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Eval_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Criterion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evalId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "Criterion_evalId_fkey" FOREIGN KEY ("evalId") REFERENCES "Eval" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModelProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evalId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "model" TEXT NOT NULL,
    "harness" TEXT NOT NULL DEFAULT 'pi',
    "effort" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "timeoutSeconds" INTEGER NOT NULL,
    "maxTurns" INTEGER NOT NULL,
    CONSTRAINT "ModelProfile_evalId_fkey" FOREIGN KEY ("evalId") REFERENCES "Eval" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Environment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "workspacePath" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "directory" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Mcp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "arguments" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EvalSkill" (
    "evalId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    PRIMARY KEY ("evalId", "skillId"),
    CONSTRAINT "EvalSkill_evalId_fkey" FOREIGN KEY ("evalId") REFERENCES "Eval" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvalSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EvalMcp" (
    "evalId" TEXT NOT NULL,
    "mcpId" TEXT NOT NULL,

    PRIMARY KEY ("evalId", "mcpId"),
    CONSTRAINT "EvalMcp_evalId_fkey" FOREIGN KEY ("evalId") REFERENCES "Eval" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvalMcp_mcpId_fkey" FOREIGN KEY ("mcpId") REFERENCES "Mcp" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evalId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "harness" TEXT NOT NULL DEFAULT 'pi',
    "status" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "agentResult" JSONB,
    "judgeResult" JSONB,
    "verdict" TEXT,
    "error" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "cacheRead" INTEGER,
    "cacheWrite" INTEGER,
    "totalTokens" INTEGER,
    "costUsd" REAL,
    "durationMs" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    CONSTRAINT "Session_evalId_fkey" FOREIGN KEY ("evalId") REFERENCES "Eval" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "criterionSnapshotId" TEXT NOT NULL,
    "criterionDescription" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "feedback" TEXT NOT NULL,
    CONSTRAINT "SessionDecision_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "phase" TEXT NOT NULL,
    "event" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionArtifact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "content" BLOB NOT NULL,
    CONSTRAINT "SessionArtifact_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Credential" (
    "provider" TEXT NOT NULL PRIMARY KEY,
    "encryptedValue" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Criterion_evalId_position_key" ON "Criterion"("evalId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ModelProfile_evalId_position_key" ON "ModelProfile"("evalId", "position");

-- CreateIndex
CREATE INDEX "Session_evalId_createdAt_idx" ON "Session"("evalId", "createdAt");

-- CreateIndex
CREATE INDEX "Session_batchId_idx" ON "Session"("batchId");

-- CreateIndex
CREATE INDEX "Session_status_idx" ON "Session"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SessionDecision_sessionId_criterionSnapshotId_key" ON "SessionDecision"("sessionId", "criterionSnapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionEvent_sessionId_sequence_key" ON "SessionEvent"("sessionId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "SessionArtifact_sessionId_phase_path_key" ON "SessionArtifact"("sessionId", "phase", "path");
