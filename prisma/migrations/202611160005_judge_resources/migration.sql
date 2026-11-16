-- CreateTable
CREATE TABLE "EvalJudgeSkill" (
    "evalId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    PRIMARY KEY ("evalId", "skillId"),
    CONSTRAINT "EvalJudgeSkill_evalId_fkey" FOREIGN KEY ("evalId") REFERENCES "Eval" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvalJudgeSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EvalJudgeMcp" (
    "evalId" TEXT NOT NULL,
    "mcpId" TEXT NOT NULL,

    PRIMARY KEY ("evalId", "mcpId"),
    CONSTRAINT "EvalJudgeMcp_evalId_fkey" FOREIGN KEY ("evalId") REFERENCES "Eval" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvalJudgeMcp_mcpId_fkey" FOREIGN KEY ("mcpId") REFERENCES "Mcp" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
