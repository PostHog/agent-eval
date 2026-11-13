import { Module } from "@nestjs/common";
import { ResourceRepository } from "./catalog/domain/resource-repository.js";
import { PrismaCatalog } from "./catalog/infrastructure/prisma-catalog.js";
import { KeyVault } from "./credentials/key-vault.js";
import { CredentialStore } from "./credentials/provider.js";
import { EvaluationsService } from "./evaluations/application/evaluations-service.js";
import { EvaluationRepository } from "./evaluations/domain/evaluation-repository.js";
import { PrismaEvaluationRepository } from "./evaluations/infrastructure/prisma-evaluation-repository.js";
import { HarnessRegistry } from "./harnesses/domain/harness-registry.js";
import { DefaultHarnessRegistry } from "./harnesses/harness-registry.js";
import { PiHarness } from "./harnesses/infrastructure/pi-harness.js";
import { EvaluationsController } from "./http/evaluations-controller.js";
import { ResourcesController } from "./http/resources-controller.js";
import { SessionsController } from "./http/sessions-controller.js";
import { SettingsController } from "./http/settings-controller.js";
import { Database } from "./infrastructure/database.js";
import { SessionWorker } from "./sessions/application/session-worker.js";
import { StartSessions } from "./sessions/application/start-sessions.js";
import { SessionRepository } from "./sessions/domain/session-repository.js";
import { WorkspaceStore } from "./sessions/domain/workspace-store.js";
import { ArtifactStore } from "./sessions/infrastructure/artifact-store.js";
import { PrismaSessionRepository } from "./sessions/infrastructure/prisma-session-repository.js";

// The composition root connects domain ports to infrastructure adapters.
@Module({
  providers: [
    Database,
    EvaluationsService,
    KeyVault,
    PiHarness,
    SessionWorker,
    StartSessions,
    { provide: HarnessRegistry, useClass: DefaultHarnessRegistry },
    { provide: ResourceRepository, useClass: PrismaCatalog },
    { provide: WorkspaceStore, useClass: ArtifactStore },
    { provide: CredentialStore, useExisting: KeyVault },
    { provide: EvaluationRepository, useClass: PrismaEvaluationRepository },
    { provide: SessionRepository, useClass: PrismaSessionRepository },
  ],
  controllers: [
    EvaluationsController,
    ResourcesController,
    SessionsController,
    SettingsController,
  ],
})
export class ApplicationModule {}
