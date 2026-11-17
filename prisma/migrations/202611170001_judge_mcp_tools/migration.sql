-- Judge MCP servers expose only the tools the evaluation author allows. Existing rows allow none.
ALTER TABLE "EvalJudgeMcp" ADD COLUMN "allowedTools" JSONB NOT NULL DEFAULT '[]';
