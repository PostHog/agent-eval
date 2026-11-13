import { Injectable, type OnApplicationShutdown } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class Database extends PrismaClient implements OnApplicationShutdown {
  // Workers finish their shutdown hooks before this connection closes.
  async onApplicationShutdown(): Promise<void> {
    await this.$disconnect();
  }
}
