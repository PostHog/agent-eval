UPDATE "Session"
SET "status" = 'failed',
    "error" = COALESCE("error", json_extract("agentResult", '$.error'), 'The agent execution failed.')
WHERE "status" = 'completed'
  AND json_extract("agentResult", '$.status') = 'failed';
