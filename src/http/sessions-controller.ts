import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  StreamableFile,
} from "@nestjs/common";
import { z } from "zod";
import { Database } from "../infrastructure/database.js";
import { StartSessions } from "../sessions/application/start-sessions.js";

@Controller("api/sessions")
export class SessionsController {
  constructor(
    @Inject(Database) private readonly db: Database,
    @Inject(StartSessions) private readonly sessions: StartSessions,
  ) {}

  @Get()
  list(@Query("evalId") evalId?: string) {
    return this.db.session.findMany({
      where: evalId ? { evalId: z.string().uuid().parse(evalId) } : {},
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { eval: { select: { title: true } }, decisions: true },
    });
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    const session = await this.db.session.findUnique({
      where: { id },
      include: { decisions: true, eval: { select: { title: true } } },
    });

    if (!session) throw new NotFoundException("Session not found.");

    return session;
  }

  @Get(":id/events")
  events(@Param("id") sessionId: string, @Query("after") after = "0") {
    return this.db.sessionEvent.findMany({
      where: {
        sessionId,
        sequence: { gt: z.coerce.number().int().nonnegative().parse(after) },
      },
      orderBy: { sequence: "asc" },
      take: 500,
    });
  }

  @Get(":id/files")
  files(@Param("id") sessionId: string) {
    return this.db.sessionArtifact.findMany({
      where: { sessionId },
      orderBy: [{ phase: "asc" }, { path: "asc" }],
      select: { id: true, path: true, phase: true },
    });
  }

  @Get(":id/files/:fileId")
  async file(@Param("id") sessionId: string, @Param("fileId") id: string) {
    const file = await this.db.sessionArtifact.findFirst({
      where: { id, sessionId },
    });

    if (!file) throw new NotFoundException("File not found.");

    return new StreamableFile(Buffer.from(file.content), {
      type: "text/plain; charset=utf-8",
    });
  }

  @Post(":id/cancel")
  cancel(@Param("id") id: string) {
    this.sessions.cancel(id);

    return { cancelling: true };
  }
}
